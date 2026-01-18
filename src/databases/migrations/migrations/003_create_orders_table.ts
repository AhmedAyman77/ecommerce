import { Migration } from '../../../types/db.types';
import { DatabaseConnection } from '../../connection/DBConnections';

export const createOrdersTable: Migration = {
    id: 3,
    name: 'create_orders_table',
    
    async up(connection: DatabaseConnection): Promise<void> {
        await connection.execute(`
            CREATE TABLE orders (
                _id VARCHAR(36) PRIMARY KEY,
                user VARCHAR(36) NOT NULL,
                products TEXT NOT NULL,
                totalAmount DECIMAL(10, 2) NOT NULL,
                stripeSessionId VARCHAR(255) UNIQUE,
                createdAt DATETIME NOT NULL,
                updatedAt DATETIME NOT NULL
            )
        `);
        
        await connection.execute(`
            CREATE INDEX idx_orders_user ON orders(user)
        `);
        
        await connection.execute(`
            CREATE INDEX idx_orders_stripe_session ON orders(stripeSessionId)
        `);
    },
    
    async down(connection: DatabaseConnection): Promise<void> {
        await connection.execute('DROP TABLE IF EXISTS orders');
    }
};