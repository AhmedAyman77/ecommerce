import { v4 as uuidv4 } from 'uuid';
import { CartItem, User } from '../../../types/models.types';
import { UserDAO } from '../../DAO/UserDAO';

export class SQLiteUserDAO extends UserDAO {
    async create(user: User): Promise<User> {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        await this.connection.execute(
            `INSERT INTO users (_id, name, email, password, role, cartItems, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, user.name, user.email, user.password, user.role, JSON.stringify(user.cartItems || []), now, now]
        );
        
        return { ...user, _id: id, createdAt: new Date(now), updatedAt: new Date(now) };
    }

    async findById(id: string): Promise<User | null> {
        const results = await this.connection.query(
            'SELECT * FROM users WHERE _id = ?',
            [id]
        );
        
        if (results.length === 0) return null;
        
        // the returned data is:
        /*
            results = [
                {
                    _id: '123',
                    name: 'Ahmed',
                    email: 'ahmed@example.com',
                    age: 25,
                    created_at: '2024-01-15'
                    ...
                }
            ]
        */
        return this.mapToUser(results[0]); // Map to a User object
    }

    async findByEmail(email: string): Promise<User | null> {
        const results = await this.connection.query(
        'SELECT * FROM users WHERE email = ?',
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

        if (user.name !== undefined) {
            updates.push('name = ?');
            values.push(user.name);
        }
        if (user.email !== undefined) {
            updates.push('email = ?');
            values.push(user.email);
        }
        if (user.password !== undefined) {
            updates.push('password = ?');
            values.push(user.password);
        }
        if (user.role !== undefined) {
            updates.push('role = ?');
            values.push(user.role);
        }

        updates.push('updatedAt = ?');
        values.push(new Date().toISOString());
        values.push(id);

        await this.connection.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE _id = ?`,
            values
        );

        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.connection.execute(
            'DELETE FROM users WHERE _id = ?',
            [id]
        );
        return result.changes > 0; // changes indicates number of rows affected
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
            'UPDATE users SET cartItems = ?, updatedAt = ? WHERE _id = ?',
            [JSON.stringify(cartItems), new Date().toISOString(), userId]
        );
    }

    async removeFromCart(userId: string, productId: string): Promise<void> {
        const user = await this.findById(userId);
        if (!user) throw new Error('User not found');

        const cartItems = (user.cartItems || []).filter(item => item.productId !== productId);

        await this.connection.execute(
            'UPDATE users SET cartItems = ?, updatedAt = ? WHERE _id = ?',
            [JSON.stringify(cartItems), new Date().toISOString(), userId]
        );
    }

    async clearCart(userId: string): Promise<void> {
        await this.connection.execute(
        'UPDATE users SET cartItems = ?, updatedAt = ? WHERE _id = ?',
        [JSON.stringify([]), new Date().toISOString(), userId]
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
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        };
    }
}