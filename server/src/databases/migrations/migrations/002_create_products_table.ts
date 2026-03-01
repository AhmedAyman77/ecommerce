import { Migration } from '../../../types/db.types';
import { DatabaseConnection } from '../../connection/DBConnections';

export const createProductsTable: Migration = {
    id: 2,
    name: 'create_products_table',
    
    async up(connection: DatabaseConnection): Promise<void> {
        await connection.execute(`
            CREATE TABLE products (
                _id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                image VARCHAR(500),
                category VARCHAR(100),
                isFeatured INTEGER DEFAULT 0,
                createdAt DATETIME NOT NULL,
                updatedAt DATETIME NOT NULL
            )
        `);
        
        await connection.execute(`
            CREATE INDEX idx_products_category ON products(category)
        `);
        
        await connection.execute(`
            CREATE INDEX idx_products_featured ON products(isFeatured)
        `);
    },
    
    async down(connection: DatabaseConnection): Promise<void> {
        await connection.execute('DROP TABLE IF EXISTS products');
    }
};