import { Request, Response } from 'express';
import { env } from '../config/env.config';
import { User } from '../types/models.types';
import { generateTokens, setCookies, storeRefreshToken } from './auth.controller';


export async function oauthCallback(req: Request, res: Response) {
    const user = req.user as User;

    if (!user?._id) {
        return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.redirect(env.CLIENT_URL);
}
