import { ProductDAO } from '../../DAO/ProductDAO';
import { Product } from '../../../types/models.types';
import { v4 as uuidv4 } from 'uuid';

export class SQLServerProductDAO extends ProductDAO {
    async create(product: Product): Promise<Product> {
        const id = uuidv4();
        const now = new Date();
        
        await this.connection.execute(
            `INSERT INTO products (_id, name, description, price, image, category, isFeatured, createdAt, updatedAt)
            VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8)`,
            [id, product.name, product.description, product.price, product.image, product.category, product.isFeatured, now, now]
        );
        
        return { ...product, _id: id, createdAt: now, updatedAt: now };
    }

    async findById(id: string): Promise<Product | null> {
        const results = await this.connection.query(
            'SELECT * FROM products WHERE _id = @param0',
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
            'SELECT * FROM products WHERE category = @param0',
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
        let paramIndex = 0;

        if (product.name !== undefined) {
            updates.push(`name = @param${paramIndex++}`);
            values.push(product.name);
        }
        if (product.description !== undefined) {
            updates.push(`description = @param${paramIndex++}`);
            values.push(product.description);
        }
        if (product.price !== undefined) {
            updates.push(`price = @param${paramIndex++}`);
            values.push(product.price);
        }
        if (product.image !== undefined) {
            updates.push(`image = @param${paramIndex++}`);
            values.push(product.image);
        }
        if (product.category !== undefined) {
            updates.push(`category = @param${paramIndex++}`);
            values.push(product.category);
        }
        if (product.isFeatured !== undefined) {
            updates.push(`isFeatured = @param${paramIndex++}`);
            values.push(product.isFeatured);
        }

        updates.push(`updatedAt = @param${paramIndex++}`);
        values.push(new Date());
        values.push(id);

        await this.connection.execute(
            `UPDATE products SET ${updates.join(', ')} WHERE _id = @param${paramIndex}`,
            values
        );

        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.connection.execute(
            'DELETE FROM products WHERE _id = @param0',
            [id]
        );
        return result.rowsAffected[0] > 0;
    }

    async toggleFeatured(id: string): Promise<Product | null> {
        await this.connection.execute(
            'UPDATE products SET isFeatured = ~isFeatured, updatedAt = @param0 WHERE _id = @param1',
            [new Date(), id]
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
            isFeatured: row.isFeatured,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}