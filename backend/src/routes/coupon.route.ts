import { Router } from 'express';
import { getCoupon, validateCoupon } from '../controllers/coupon.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';

const router = Router();
router.post('/', requireAdmin, getCoupon);
router.post('/apply', requireAuth, validateCoupon);
export default router;