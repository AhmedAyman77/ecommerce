import { ProductDAO } from '../../DAO/ProductDAO';
import { Product } from '../../../types/models.types';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteProductDAO extends ProductDAO {
    async create(product: Product): Promise<Product> {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        await this.connection.execute(
            `INSERT INTO products (_id, name, description, price, image, category, isFeatured, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, product.name, product.description, product.price, product.image, product.category, product.isFeatured ? 1 : 0, now, now]
        );
        
        return { ...product, _id: id, createdAt: new Date(now), updatedAt: new Date(now) };
    }

    async findById(id: string): Promise<Product | null> {
        const results = await this.connection.query(
            'SELECT * FROM products WHERE _id = ?',
            [id]
        );
        
        if (results.length === 0) return null;
        
        return this.mapToProduct(results[0]);
    }

    async findAll(): Promise<Product[]> {
        const results = await this.connection.query('SELECT * FROM products');
        return results.map((row: any) => this.mapToProduct(row));
    }

    async findByCategory(category: string): Promise<Product[]> {
        const results = await this.connection.query(
            'SELECT * FROM products WHERE category = ?',
            [category]
        );
        return results.map((row: any) => this.mapToProduct(row));
    }

    async findFeatured(): Promise<Product[]> {
        const results = await this.connection.query(
            'SELECT * FROM products WHERE isFeatured = 1'
        );
        return results.map((row: any) => this.mapToProduct(row));
    }

    async update(id: string, product: Partial<Product>): Promise<Product | null> {
        const updates: string[] = [];
        const values: any[] = [];

        if (product.name !== undefined) {
            updates.push('name = ?');
            values.push(product.name);
        }
        if (product.description !== undefined) {
            updates.push('description = ?');
            values.push(product.description);
        }
        if (product.price !== undefined) {
            updates.push('price = ?');
            values.push(product.price);
        }
        if (product.image !== undefined) {
            updates.push('image = ?');
            values.push(product.image);
        }
        if (product.category !== undefined) {
            updates.push('category = ?');
            values.push(product.category);
        }
        if (product.isFeatured !== undefined) {
            updates.push('isFeatured = ?');
            values.push(product.isFeatured ? 1 : 0);
        }

        updates.push('updatedAt = ?');
        values.push(new Date().toISOString());
        values.push(id);

        await this.connection.execute(
        `UPDATE products SET ${updates.join(', ')} WHERE _id = ?`,
        values
        );

        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.connection.execute(
            'DELETE FROM products WHERE _id = ?',
            [id]
        );
        return result.changes > 0;
    }

    async toggleFeatured(id: string): Promise<Product | null> {
        await this.connection.execute(
            'UPDATE products SET isFeatured = NOT isFeatured, updatedAt = ? WHERE _id = ?',
            [new Date().toISOString(), id]
        );
        return this.findById(id);
    }

    private mapToProduct(row: any): Product {
        return {
            _id: row._id,
            name: row.name,
            description: row.description,
            price: row.price,
            image: row.image,
            category: row.category,
            isFeatured: row.isFeatured === 1,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
        };
    }
}