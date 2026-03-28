import { Migration } from '../../../types/db.types';
import { DatabaseConnection } from '../../connection/DBConnections';

export const addOAuthToUsers: Migration = {
    id: 5,
    name: 'add_oauth_to_users',

    async up(connection: DatabaseConnection): Promise<void> {
        await connection.execute(`ALTER TABLE users ADD COLUMN oauthProvider VARCHAR(50)`);
        await connection.execute(`ALTER TABLE users ADD COLUMN oauthId VARCHAR(255)`);
        await connection.execute(`CREATE INDEX idx_users_oauth ON users(oauthProvider, oauthId)`);
    },

    async down(connection: DatabaseConnection): Promise<void> {
        // SQLite doesn't support DROP COLUMN — recreate the table without the columns
        await connection.execute(`
            CREATE TABLE users_backup AS
            SELECT _id, name, email, password, role, cartItems, createdAt, updatedAt
            FROM users
        `);
        await connection.execute(`DROP TABLE users`);
        await connection.execute(`ALTER TABLE users_backup RENAME TO users`);
        await connection.execute(`CREATE INDEX idx_users_email ON users(email)`);
    },
};
