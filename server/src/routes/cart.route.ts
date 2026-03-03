import { Router } from 'express';
import { getCartProducts, addToCart, updateQuantity, removeProductFromCart } from '../controllers/cart.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';


const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(getCartProducts));
router.post('/', asyncHandler(addToCart));
router.delete('/:productId', asyncHandler(removeProductFromCart));
router.put('/:productId', asyncHandler(updateQuantity));
export default router;