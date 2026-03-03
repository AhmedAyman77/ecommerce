import { Request, Response } from 'express';
import { DAOFactory } from '../databases/DAOFactory';
import { redisClient } from '../config/redis';
import { uploader } from '../config/cloudinary';
import { NotFoundError } from '../types/error.types';

const productDAO = DAOFactory.getInstance().getProductDAO();

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

  if (!featuredProducts || featuredProducts.length === 0) {
    throw new NotFoundError('No featured products found');
  }

  await redisClient.set('featured_products', JSON.stringify(featuredProducts));

  res.json(featuredProducts);
}

export async function createProduct(req: Request, res: Response) {
  const { name, description, price, image, category } = req.body;

  let cloudinaryResponse = null;

  if (image) {
    try {
      cloudinaryResponse = await uploader.upload(image, { folder: 'products' });
    } catch (error) {
      console.error('Error uploading image to cloudinary', error);
      return res.status(500).json({ message: 'Failed to upload image' });
    }
  }

  const product = await productDAO.create({
    name,
    description,
    price,
    image: cloudinaryResponse?.secure_url || '',
    category,
    isFeatured: false,
  });

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
        console.log('Deleted image from cloudinary');
      } catch (error) {
        console.error('Error deleting image from cloudinary', error);
      }
    }
  }

  if (product.isFeatured) {
    await removeOneFeaturedProductsCache(req.params.id);
  }

  await productDAO.delete(req.params.id);

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