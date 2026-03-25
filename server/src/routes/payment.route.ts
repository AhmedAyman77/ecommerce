import { Router } from 'express';
import { createCheckoutSession, checkoutSuccess } from '../controllers/payment.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { rateLimit, rules } from '../middlewares/security.middleware';

const router = Router();

router.post('/checkout', requireAuth, rateLimit.checkout, rules.checkout,        asyncHandler(createCheckoutSession));
router.post('/success',               rateLimit.checkout, rules.checkoutSuccess, asyncHandler(checkoutSuccess));

export default router;