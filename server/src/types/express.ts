import { User } from './models.types';

type AuthUser = Omit<User, 'password'>;

declare global {
    namespace Express {
        interface User extends AuthUser {}
    }
}

export {};