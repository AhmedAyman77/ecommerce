import { Router } from 'express';
import { signup, login, logout, refreshToken, getProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import { rateLimit, rules } from '../middlewares/security.middleware';
import { oauthCallback } from '../controllers/oauth.controller';
import passport from 'passport';

const router = Router();

router.post('/signup', rateLimit.signup, rules.signup, asyncHandler(signup));
router.post('/login', rateLimit.login, rules.login, asyncHandler(login));

router.post('/logout', asyncHandler(logout));
router.post('/refresh-token', asyncHandler(refreshToken));
router.get('/profile', requireAuth, asyncHandler(getProfile));

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=google_failed', session: false }),
    asyncHandler(oauthCallback)
);

router.get('/github',
    passport.authenticate('github', { scope: ['user:email'], session: false })
);
router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/login?error=github_failed', session: false }),
    asyncHandler(oauthCallback)
);

export default router;