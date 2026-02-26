import { Router } from 'express';
import { createCheckoutSession, checkoutSuccess } from '../controllers/payment.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
router.post('/checkout', requireAuth, createCheckoutSession);
router.post('/success', checkoutSuccess);
export default router;