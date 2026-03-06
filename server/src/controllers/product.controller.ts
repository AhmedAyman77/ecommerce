import { Request, Response } from 'express';
import { uploader, uploadStream } from '../config/cloudinary';
import { redisClient } from '../config/redis';
import { DAOFactory } from '../databases/DAOFactory';
import { NotFoundError, ValidationError } from '../types/error.types';
import { esProductDAO } from '../databases/implementations/elasticsearch/ElasticsearchProductDAO';
import { UserDAO } from '../databases/DAO/UserDAO';

const productDAO = DAOFactory.getInstance().getProductDAO();
const userDAO = DAOFactory.getInstance().getUserDAO();

export async function getAllProducts(_: Request, res: Response) {
  const products = await productDAO.findAll();
  res.json({ products });
}

export async function getFeaturedProducts(_: Request, res: Response) {
  const cached = await redisClient.get('featured_products');
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const featuredProducts = await productDAO.findFeatured();

  if (featuredProducts) {
    await redisClient.set('featured_products', JSON.stringify(featuredProducts));
  }

  res.json(featuredProducts);
}

export async function createProduct(req: Request, res: Response) {
  const { name, description, price, category } = req.body;
  const image = req.file;
  if (!name || !description || !price || !category) {
      throw new ValidationError('Name, description, price, and category are required');
  }

  if (isNaN(Number(price)) || Number(price) <= 0) {
      throw new ValidationError('Price must be a positive number');
  }

  let imageUrl = '';

  if (image) {
    try {
      const result = await uploadStream(image.buffer, 'products');
      imageUrl = result.secure_url;
    } catch (error: any) {
      throw new ValidationError(`Image upload failed: ${error.message}`);
    }
  }

  const product = await productDAO.create({
    name,
    description,
    price,
    image: imageUrl,
    category,
    isFeatured: false,
  });

  await esProductDAO.index(product);

  res.status(201).json(product);
}

export async function deleteProduct(req: Request, res: Response) {
  const product = await productDAO.findById(req.params.id);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.image) {
    const publicId = product.image.split('/').pop()?.split('.')[0];
    if (publicId) {
      try {
        await uploader.destroy(`products/${publicId}`);
      } catch (error) {
        console.error('Error deleting image from cloudinary', error);
      }
    }
  }

  if (product.isFeatured) {
    await removeOneFeaturedProductsCache(req.params.id);
  }

  const allUsers = await userDAO.findAll();

  await Promise.all(allUsers.map(async (user) => {
    await userDAO.removeFromCart(user._id!, req.params.id);
  }));

  await productDAO.delete(req.params.id);
  await esProductDAO.remove(req.params.id);

  res.json({ message: 'Product deleted successfully' });
}

export async function getRecommendedProducts(_: Request, res: Response) {
  const recommendedProducts = await productDAO.findRandom(10);
  const recommendedProductsReduced = recommendedProducts.map(p => ({
    _id: p._id,
    name: p.name,
    description: p.description,
    image: p.image,
    price: p.price,
  }));
  res.json(recommendedProductsReduced);
}

export async function getProductsByCategory(req: Request, res: Response) {
  const { category } = req.params;
  const products = await productDAO.findByCategory(category);
  res.json({ products });
}

export async function toggleFeaturedProduct(req: Request, res: Response) {
    const product = await productDAO.toggleFeatured(req.params.id);
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await updateFeaturedProductsCache();
    await esProductDAO.index(product);
    res.json(product);
}

async function updateFeaturedProductsCache() {
  const featuredProducts = await productDAO.findFeatured();
  await redisClient.set('featured_products', JSON.stringify(featuredProducts));
}

async function removeOneFeaturedProductsCache(productId: string) {
  const cached = await redisClient.get('featured_products');

  if (cached) {
    let featuredProducts = JSON.parse(cached);
    featuredProducts = featuredProducts.filter((product: any) => product._id !== productId);
    await redisClient.set('featured_products', JSON.stringify(featuredProducts));
  }
}

export async function searchProducts(req: Request, res: Response) {
  const query = req.query.q as string;
  const category = req.query.category as string | undefined;
  
  if (!query) {
    throw new ValidationError('Search query (q) is required');
  }

  const products = await esProductDAO.search(query, category);

  res.json({ products });
}



