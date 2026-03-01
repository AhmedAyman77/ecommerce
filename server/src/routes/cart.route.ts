import { Router } from 'express';
import { getCartProducts, addToCart, removeAllFromCart, updateQuantity } from '../controllers/cart.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';


const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(getCartProducts));
router.post('/add', asyncHandler(addToCart));
router.post('/remove', asyncHandler(removeAllFromCart));
router.post('/update', asyncHandler(updateQuantity));
export default router;