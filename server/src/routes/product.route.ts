import { Router } from 'express';
import { getAllProducts, getFeaturedProducts, createProduct, deleteProduct, getRecommendedProducts, getProductsByCategory, toggleFeaturedProduct } from '../controllers/product.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
router.get('/', asyncHandler(getAllProducts));
router.get('/featured', asyncHandler(getFeaturedProducts));
router.post('/', requireAuth, requireAdmin, asyncHandler(createProduct));
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(deleteProduct));
router.get('/recommendations', asyncHandler(getRecommendedProducts));
router.get('/category/:category', asyncHandler(getProductsByCategory));
router.patch('/toggle-featured/:id', requireAuth, requireAdmin, asyncHandler(toggleFeaturedProduct));
export default router;