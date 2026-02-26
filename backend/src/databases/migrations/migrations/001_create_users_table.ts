import { Migration } from '../../../types/db.types';
import { DatabaseConnection } from '../../connection/DBConnections';

export const createUsersTable: Migration = {
    id: 1,
    name: 'create_users_table',
    
    async up(connection: DatabaseConnection): Promise<void> {
        await connection.execute(`
            CREATE TABLE users (
                _id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'admin')),
                cartItems TEXT,
                createdAt DATETIME NOT NULL,
                updatedAt DATETIME NOT NULL
            )
        `);
        
        await connection.execute(`
            CREATE INDEX idx_users_email ON users(email)
        `);
    },
    
    async down(connection: DatabaseConnection): Promise<void> {
        await connection.execute('DROP TABLE IF EXISTS users');
    }
};