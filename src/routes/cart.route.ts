import { Router } from 'express';
import { getCartProducts, addToCart, removeAllFromCart, updateQuantity } from '../controllers/cart.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', requireAuth, getCartProducts);
router.post('/add', requireAuth, addToCart);
router.post('/remove', requireAuth, removeAllFromCart);
router.post('/update', requireAuth, updateQuantity);
export default router;