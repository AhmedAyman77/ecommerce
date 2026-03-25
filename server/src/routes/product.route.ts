import { Router } from 'express';
import { getAllProducts, getFeaturedProducts, createProduct, deleteProduct, getRecommendedProducts, getProductsByCategory, toggleFeaturedProduct, searchProducts } from '../controllers/product.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { upload } from '../config/multer';
import { rateLimit, rules } from '../middlewares/security.middleware';

const router = Router();

router.get('/',asyncHandler(getAllProducts));
router.get('/featured',asyncHandler(getFeaturedProducts));
router.get('/recommendations',asyncHandler(getRecommendedProducts));
router.get('/category/:category', asyncHandler(getProductsByCategory));

router.get('/search', rateLimit.search, rules.search, asyncHandler(searchProducts));

router.post('/',requireAuth, requireAdmin, upload.single('image'), rules.createProduct,asyncHandler(createProduct));
router.delete('/:id',requireAuth, requireAdmin, rules.productId, asyncHandler(deleteProduct));
router.patch('/toggle-featured/:id', requireAuth, requireAdmin, rules.productId, asyncHandler(toggleFeaturedProduct));

export default router;