import { Router } from 'express';
import { signup, login, logout, refreshToken, getProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { rateLimit, rules } from '../middlewares/security.middleware';

const router = Router();

router.post('/signup', rateLimit.signup, rules.signup, asyncHandler(signup));
router.post('/login', rateLimit.login, rules.login, asyncHandler(login));

router.post('/logout', asyncHandler(logout));
router.post('/refresh-token', asyncHandler(refreshToken));
router.get('/profile', requireAuth, asyncHandler(getProfile));

export default router;