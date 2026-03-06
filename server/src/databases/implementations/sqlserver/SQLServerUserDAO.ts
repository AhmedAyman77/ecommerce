import { v4 as uuidv4 } from 'uuid';
import { CartItem, User } from '../../../types/models.types';
import { UserDAO } from '../../DAO/UserDAO';

export class SQLServerUserDAO extends UserDAO {
    async create(user: User): Promise<User> {
        const id = uuidv4();
        const now = new Date();
        
        await this.connection.execute(
            `INSERT INTO users (_id, name, email, password, role, cartItems, createdAt, updatedAt)
            VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7)`,
            [id, user.name, user.email, user.password, user.role, JSON.stringify(user.cartItems || []), now, now]
        );
        
        return { ...user, _id: id, createdAt: now, updatedAt: now };
    }

    async findById(id: string): Promise<User | null> {
        const results = await this.connection.query(
            'SELECT * FROM users WHERE _id = @param0',
            [id]
        );
        
        if (results.length === 0) return null;
        return this.mapToUser(results[0]);
    }

    async findByEmail(email: string): Promise<User | null> {
        const results = await this.connection.query(
            'SELECT * FROM users WHERE email = @param0',
            [email]
        );
        
        if (results.length === 0) return null;
        return this.mapToUser(results[0]);
    }

    async findAll(): Promise<User[]> {
        const results = await this.connection.query('SELECT * FROM users');
        return results.map((row: any) => this.mapToUser(row));
    }

    async update(id: string, user: Partial<User>): Promise<User | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 0;

        if (user.name !== undefined) {
            updates.push(`name = @param${paramIndex++}`);
            values.push(user.name);
        }
        if (user.email !== undefined) {
            updates.push(`email = @param${paramIndex++}`);
            values.push(user.email);
        }
        if (user.password !== undefined) {
            updates.push(`password = @param${paramIndex++}`);
            values.push(user.password);
        }
        if (user.role !== undefined) {
            updates.push(`role = @param${paramIndex++}`);
            values.push(user.role);
        }

        updates.push(`updatedAt = @param${paramIndex++}`);
        values.push(new Date());
        values.push(id);

        await this.connection.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE _id = @param${paramIndex}`,
            values
        );

        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.connection.execute(
            'DELETE FROM users WHERE _id = @param0',
            [id]
        );
        return result.rowsAffected[0] > 0;
    }

    async addToCart(userId: string, productId: string, quantity: number): Promise<void> {
        const user = await this.findById(userId);
        if (!user) throw new Error('User not found');

        const cartItems = user.cartItems || [];
        const existingItem = cartItems.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cartItems.push({ productId: productId, quantity });
        }

        await this.connection.execute(
            'UPDATE users SET cartItems = @param0, updatedAt = @param1 WHERE _id = @param2',
            [JSON.stringify(cartItems), new Date(), userId]
        );
    }

    async removeFromCart(userId: string, productId: string): Promise<void> {
        const user = await this.findById(userId);
        if (!user) throw new Error('User not found');

        const cartItems = (user.cartItems || []).filter(item => item.productId !== productId);

        await this.connection.execute(
            'UPDATE users SET cartItems = @param0, updatedAt = @param1 WHERE _id = @param2',
            [JSON.stringify(cartItems), new Date(), userId]
        );
    }

    async clearCart(userId: string): Promise<void> {
        await this.connection.execute(
            'UPDATE users SET cartItems = @param0, updatedAt = @param1 WHERE _id = @param2',
            [JSON.stringify([]), new Date(), userId]
        );
    }

    async getCart(userId: string): Promise<CartItem[]> {
        const user = await this.findById(userId);
        return user?.cartItems || [];
    }

    private mapToUser(row: any): User {
        return {
            _id: row._id,
            name: row.name,
            email: row.email,
            password: row.password,
            role: row.role,
            cartItems: JSON.parse(row.cartItems || '[]'),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}