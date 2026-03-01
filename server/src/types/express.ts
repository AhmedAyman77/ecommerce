
import { User } from "./models.types";

type AuthUser = Omit<User, 'password'>;
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export {};