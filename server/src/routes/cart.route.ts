import { Router } from 'express';
import { getCartProducts, addToCart, updateQuantity, removeProductFromCart } from '../controllers/cart.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { rules } from '../middlewares/security.middleware';


const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(getCartProducts));
router.post('/', rules.cartItem, asyncHandler(addToCart));
router.put('/:productId', rules.updateQuantity, asyncHandler(updateQuantity));
router.delete('/:productId', asyncHandler(removeProductFromCart));
export default router;