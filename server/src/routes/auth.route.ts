import { Router } from 'express';
import { signup, login, logout, refreshToken, getProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();

router.post('/signup', asyncHandler(signup));
router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.post('/refresh-token', asyncHandler(refreshToken));
router.get('/profile', requireAuth, asyncHandler(getProfile));

export default router;