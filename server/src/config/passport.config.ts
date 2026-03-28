import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { DAOFactory } from '../databases/DAOFactory';
import { User } from '../types/models.types';

const userDAO = DAOFactory.getInstance().getUserDAO();

async function handleOAuthUser(
    provider: 'google' | 'github',
    oauthId: string,
    email: string,
    name: string,
    done: (err: any, user?: any) => void
) {
    try {
        let user = await userDAO.findByOAuth(provider, oauthId);
        if (user) return done(null, user);

        user = await userDAO.findByEmail(email);
        if (user) {
            await userDAO.update(user._id!, { oauthProvider: provider, oauthId });
            return done(null, { ...user, oauthProvider: provider, oauthId });
        }

        const newUser: User = {
            name,
            email,
            password: '',
            role: 'customer',
            cartItems: [],
            oauthProvider: provider,
            oauthId,
        };
        const created = await userDAO.create(newUser);
        return done(null, created);

    } catch (err) {
        return done(err);
    }
}


passport.use(new GoogleStrategy(
    {
        clientID:     process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL:  '/api/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value ?? '';
        const name  = profile.displayName || 'Google User';
        await handleOAuthUser('google', profile.id, email, name, done);
    }
));


passport.use(new GitHubStrategy(
    {
        clientID:     process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL:  '/api/auth/github/callback',
        scope:        ['user:email'],
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        const email = profile.emails?.find((e: any) => e.primary && e.verified)?.value
                ?? profile.emails?.[0]?.value
                ?? '';
        const name  = profile.displayName || profile.username || 'GitHub User';
        await handleOAuthUser('github', String(profile.id), email, name, done);
    }
));

// Passport requires serialize/deserialize even if we don't use sessions
// (we're using JWT cookies, not session-based auth)
passport.serializeUser((user: any, done) => done(null, user._id));
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await userDAO.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

export default passport;
