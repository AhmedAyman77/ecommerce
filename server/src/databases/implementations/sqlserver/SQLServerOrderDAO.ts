import { OrderDAO } from '../../DAO/OrderDAO';
import { Order } from '../../../types/models.types';
import { v4 as uuidv4 } from 'uuid';

export class SQLServerOrderDAO extends OrderDAO {
    async create(order: Order): Promise<Order> {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        await this.connection.execute(
            `INSERT INTO orders (_id, user, products, totalAmount, stripeSessionId, createdAt, updatedAt)
            VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6)`,
            [id, order.user, JSON.stringify(order.products), order.totalAmount, order.stripeSessionId, now, now]
        );
        
        return { ...order, _id: id, createdAt: new Date(now), updatedAt: new Date(now) };
    }

    async findById(id: string): Promise<Order | null> {
        const results = await this.connection.query(
            'SELECT * FROM orders WHERE _id = @param0',
            [id]
        );
        
        if (results.length === 0) return null;
        return this.mapToOrder(results[0]);
    }

    async findAll(): Promise<Order[]> {
        const results = await this.connection.query('SELECT * FROM orders');
        return results.map((row: any) => this.mapToOrder(row));
    }

    async findByUserId(userId: string): Promise<Order[]> {
        const results = await this.connection.query(
            'SELECT * FROM orders WHERE user = @param0',
            [userId]
        );
        return results.map((row: any) => this.mapToOrder(row));
    }

    async findByStripeSessionId(sessionId: string): Promise<Order | null> {
        const results = await this.connection.query(
            'SELECT * FROM orders WHERE stripeSessionId = @param0',
            [sessionId]
        );
        
        if (results.length === 0) return null;
        return this.mapToOrder(results[0]);
    }

    async update(id: string, order: Partial<Order>): Promise<Order | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 0;

        if (order.products !== undefined) {
            updates.push(`products = @param${paramIndex++}`);
            values.push(JSON.stringify(order.products));
        }
        if (order.totalAmount !== undefined) {
            updates.push(`totalAmount = @param${paramIndex++}`);
            values.push(order.totalAmount);
        }

        updates.push(`updatedAt = @param${paramIndex++}`);
        values.push(new Date().toISOString());
        values.push(id);

        await this.connection.execute(
            `UPDATE orders SET ${updates.join(', ')} WHERE _id = @param${paramIndex}`,
            values
        );

        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.connection.execute(
            'DELETE FROM orders WHERE _id = @param0',
            [id]
        );
        return result.changes > 0;
    }

    private mapToOrder(row: any): Order {
        return {
            _id: row._id,
            user: row.user,
            products: JSON.parse(row.products),
            totalAmount: row.totalAmount,
            stripeSessionId: row.stripeSessionId,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        };
    }
}