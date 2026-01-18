import { Migration } from '../../../types/db.types';
import { DatabaseConnection } from '../../connection/DBConnections';

export const createCouponsTable: Migration = {
    id: 4,
    name: 'create_coupons_table',
    
    async up(connection: DatabaseConnection): Promise<void> {
        await connection.execute(`
            CREATE TABLE coupons (
                _id VARCHAR(36) PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                discountPercentage INTEGER NOT NULL,
                expirationDate DATETIME NOT NULL,
                isActive INTEGER DEFAULT 1,
                userId VARCHAR(36) NOT NULL,
                createdAt DATETIME NOT NULL,
                updatedAt DATETIME NOT NULL
            )
        `);
        
        await connection.execute(`
            CREATE INDEX idx_coupons_code ON coupons(code)
        `);
        
        await connection.execute(`
            CREATE INDEX idx_coupons_user ON coupons(userId)
        `);
    },
    
    async down(connection: DatabaseConnection): Promise<void> {
        await connection.execute('DROP TABLE IF EXISTS coupons');
    }
};