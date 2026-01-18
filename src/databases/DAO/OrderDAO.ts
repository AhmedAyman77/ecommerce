import { BaseDAO } from './BaseDAO';
import { Order } from '../../types/models.types';

export abstract class OrderDAO extends BaseDAO<Order> {
    abstract findByUserId(userId: string): Promise<Order[]>;
    abstract findByStripeSessionId(sessionId: string): Promise<Order | null>;
}