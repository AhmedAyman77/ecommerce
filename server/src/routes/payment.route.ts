import { Router } from 'express';
import { createCheckoutSession, checkoutSuccess } from '../controllers/payment.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
router.post('/checkout', requireAuth, asyncHandler(createCheckoutSession));
router.post('/success', asyncHandler(checkoutSuccess));
export default router;