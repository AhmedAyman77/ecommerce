import { BaseDAO } from './BaseDAO';
import { User, CartItem } from '../../types/models.types';

export abstract class UserDAO extends BaseDAO<User> {
    abstract findByEmail(email: string): Promise<User | null>;
    abstract addToCart(userId: string, productId: string, quantity: number): Promise<void>;
    abstract removeFromCart(userId: string, productId: string): Promise<void>;
    abstract clearCart(userId: string): Promise<void>;
    abstract getCart(userId: string): Promise<CartItem[]>;
    abstract removeProductFromAllCarts(productId: string): Promise<void>;
}