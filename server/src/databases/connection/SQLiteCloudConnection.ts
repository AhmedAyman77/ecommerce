import { Database } from '@sqlitecloud/drivers';
import { DatabaseConnection } from './DBConnections';

export class SQLiteCloudConnection implements DatabaseConnection {
    private db: Database | null = null;
    private connectionString: string;

    constructor(connectionString: string) {
        this.connectionString = connectionString;
    }

    async connect(): Promise<void> {
        if (!this.db) {
            this.db = new Database(this.connectionString);
        }
    }

    async disconnect(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    getConnection(): any {
        if (!this.db) {
            throw new Error('Database not connected.');
        }
        return this.db;
    }

    async query(sql: string, params?: any[]): Promise<any> {
        if (!this.db) {
            throw new Error('Database not connected.');
        }
        return this.db.sql(sql, ...(params ?? []));
    }

    async execute(sql: string, params?: any[]): Promise<any> {
        if (!this.db) {
            throw new Error('Database not connected.');
        }
        return this.db.sql(sql, ...(params ?? []));
    }

    async beginTransaction(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected.');
        }
        await this.db.sql('BEGIN TRANSACTION');
    }

    async commit(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected.');
        }
        await this.db.sql('COMMIT');
    }

    async rollback(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected.');
        }
        await this.db.sql('ROLLBACK');
    }
}