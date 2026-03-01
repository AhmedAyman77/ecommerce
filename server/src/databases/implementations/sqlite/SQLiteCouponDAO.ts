import { CouponDAO } from '../../DAO/CouponDAO';
import { Coupon } from '../../../types/models.types';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteCouponDAO extends CouponDAO {
    async create(coupon: Coupon): Promise<Coupon> {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        await this.connection.execute(
            `INSERT INTO coupons (_id, code, discountPercentage, expirationDate, isActive, userId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, coupon.code, coupon.discountPercentage, coupon.expirationDate.toISOString(), coupon.isActive ? 1 : 0, coupon.userId, now, now]
        );
        
        return { ...coupon, _id: id, createdAt: new Date(now), updatedAt: new Date(now) };
    }

    async findById(id: string): Promise<Coupon | null> {
        const results = await this.connection.query(
            'SELECT * FROM coupons WHERE _id = ?',
            [id]
        );
        
        if (results.length === 0) return null;
        return this.mapToCoupon(results[0]);
    }

    async findByCode(code: string): Promise<Coupon | null> {
        const results = await this.connection.query(
            'SELECT * FROM coupons WHERE code = ?',
            [code]
        );
        
        if (results.length === 0) return null;
        return this.mapToCoupon(results[0]);
    }

    async findByUserId(userId: string): Promise<Coupon | null> {
        const results = await this.connection.query(
            'SELECT * FROM coupons WHERE userId = ? AND isActive = 1',
            [userId]
        );
        
        if (results.length === 0) return null;
        return this.mapToCoupon(results[0]);
    }

    async findAll(): Promise<Coupon[]> {
        const results = await this.connection.query('SELECT * FROM coupons');
        return results.map((row: any) => this.mapToCoupon(row));
    }

    async update(id: string, coupon: Partial<Coupon>): Promise<Coupon | null> {
        const updates: string[] = [];
        const values: any[] = [];

        if (coupon.code !== undefined) {
            updates.push('code = ?');
            values.push(coupon.code);
        }
        if (coupon.discountPercentage !== undefined) {
            updates.push('discountPercentage = ?');
            values.push(coupon.discountPercentage);
        }
        if (coupon.expirationDate !== undefined) {
            updates.push('expirationDate = ?');
            values.push(coupon.expirationDate.toISOString());
        }
        if (coupon.isActive !== undefined) {
            updates.push('isActive = ?');
            values.push(coupon.isActive ? 1 : 0);
        }

        updates.push('updatedAt = ?');
        values.push(new Date().toISOString());
        values.push(id);

        await this.connection.execute(
            `UPDATE coupons SET ${updates.join(', ')} WHERE _id = ?`,
            values
        );

        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.connection.execute(
            'DELETE FROM coupons WHERE _id = ?',
            [id]
        );
        return result.changes > 0;
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.connection.execute(
            'DELETE FROM coupons WHERE userId = ?',
            [userId]
        );
    }

    async deactivate(id: string): Promise<void> {
        await this.connection.execute(
            'UPDATE coupons SET isActive = 0, updatedAt = ? WHERE _id = ?',
            [new Date().toISOString(), id]
        );
    }

    private mapToCoupon(row: any): Coupon {
        return {
            _id: row._id,
            code: row.code,
            discountPercentage: row.discountPercentage,
            expirationDate: new Date(row.expirationDate),
            isActive: row.isActive === 1,
            userId: row.userId,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        };
    }
}