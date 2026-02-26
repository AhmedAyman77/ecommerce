import { BaseDAO } from './BaseDAO';
import { Coupon } from '../../types/models.types';

export abstract class CouponDAO extends BaseDAO<Coupon> {
    abstract findByCode(code: string): Promise<Coupon | null>;
    abstract findByUserId(userId: string): Promise<Coupon | null>;
    abstract deactivate(id: string): Promise<void>;
    abstract deleteByUserId(userId: string): Promise<void>;
}