// server/src/routes/product.route.ts
import { Router } from 'express';
import { getAllProducts, getFeaturedProducts, createProduct, deleteProduct, getRecommendedProducts, getProductsByCategory, toggleFeaturedProduct } from '../controllers/product.controller';
import { requireAdmin } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.post('/', requireAdmin, createProduct);
router.delete('/:id', requireAdmin, deleteProduct);
router.get('/recommended', getRecommendedProducts);
router.get('/category/:category', getProductsByCategory);
router.post('/toggle-featured/:id', requireAdmin, toggleFeaturedProduct);
export default router;