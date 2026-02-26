import { Request, Response } from 'express';
import { DAOFactory } from '../databases/DAOFactory';
import { redisClient } from '../config/redis';
import { uploader } from '../config/cloudinary';

const productDAO = DAOFactory.getInstance().getProductDAO();

export async function getAllProducts(_: Request, res: Response) {
  try {
    const products = await productDAO.findAll();
    res.json({ products });
  } catch (error: any) {
    console.error('Error in getAllProducts controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getFeaturedProducts(_: Request, res: Response) {
  try {
    const cached = await redisClient.get('featured_products');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const featuredProducts = await productDAO.findFeatured();

    if (!featuredProducts || featuredProducts.length === 0) {
      return res.status(404).json({ message: 'No featured products found' });
    }

    await redisClient.set('featured_products', JSON.stringify(featuredProducts));

    res.json(featuredProducts);
  } catch (error: any) {
    console.error('Error in getFeaturedProducts controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const { name, description, price, image, category } = req.body;

    let cloudinaryResponse = null;

    if (image) {
      cloudinaryResponse = await uploader.upload(image, { folder: 'products' });
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
  } catch (error: any) {
    console.error('Error in createProduct controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const product = await productDAO.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
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
  } catch (error: any) {
    console.error('Error in deleteProduct controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getRecommendedProducts(_: Request, res: Response) {
  try {
    const allProducts = await productDAO.findAll();
    const shuffled = allProducts.sort(() => 0.5 - Math.random());
    const recommended = shuffled.slice(0, 4).map(p => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      image: p.image,
      price: p.price,
    }));

    res.json(recommended);
  } catch (error: any) {
    console.error('Error in getRecommendedProducts controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getProductsByCategory(req: Request, res: Response) {
  try {
    const { category } = req.params;
    const products = await productDAO.findByCategory(category);
    res.json({ products });
  } catch (error: any) {
    console.error('Error in getProductsByCategory controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function toggleFeaturedProduct(req: Request, res: Response) {
  try {
    const product = await productDAO.toggleFeatured(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await updateFeaturedProductsCache();
    res.json(product);
  } catch (error: any) {
    console.error('Error in toggleFeaturedProduct controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await productDAO.findFeatured();
    await redisClient.set('featured_products', JSON.stringify(featuredProducts));
  } catch (error) {
    console.error('Error in update cache function', error);
  }
}

async function removeOneFeaturedProductsCache(productId: string) {
  try {
    const cached = await redisClient.get('featured_products');

    if (cached) {
      let featuredProducts = JSON.parse(cached);
      featuredProducts = featuredProducts.filter((product: any) => product._id !== productId);
      await redisClient.set('featured_products', JSON.stringify(featuredProducts));
    }
  } catch (error) {
    console.error('Error in remove one from cache function', error);
  }
}