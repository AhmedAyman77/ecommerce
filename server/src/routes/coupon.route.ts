import { Router } from 'express';
import { getCoupon, validateCoupon } from '../controllers/coupon.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(getCoupon));
router.post('/apply', asyncHandler(validateCoupon));
export default router;