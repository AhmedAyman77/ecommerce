import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { DatabaseConnection } from './DBConnections';

export class SQLiteConnection implements DatabaseConnection {
    private db: Database | null = null;
    private dbPath: string;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
    }
    
    async connect(): Promise<void> {
        this.db = await open({
            filename: this.dbPath,
            driver: sqlite3.Database
        });
        await this.db.exec('PRAGMA foreign_keys = ON;'); // Enable foreign key constraints
    }

    async disconnect(): Promise<void> {
        if(this.db) {
            await this.db.close();
            this.db = null;
        }
    }
    getConnection(): any {
        if(!this.db) {
            throw new Error('Database not connected.');
        }
        return this.db;
    }
    async query(sql: string, params?: any[]): Promise<any> { // execute a SELECT query that returns rows
        if(!this.db) {
            throw new Error('Database not connected.');
        }
        return this.db.all(sql, params); // returning a promise from async function automatically awaits it
    }
    async execute(sql: string, params?: any[]): Promise<any> { // execute a query like INSERT, UPDATE, DELETE
        if(!this.db) {
            throw new Error('Database not connected.');
        }
        return this.db.run(sql, params);
    }
    async beginTransaction(): Promise<void> { // execute multiple queries in a transaction (all or nothing)
        if (!this.db) {
            throw new Error('Database not connected.');
        }
        await this.db.exec('BEGIN TRANSACTION;');
    }
    async commit(): Promise<void> { // save changes made during the transaction
        if (!this.db) {
            throw new Error('Database not connected.');
        }
        await this.db.exec('COMMIT;');
    }
    async rollback(): Promise<void> { // undo changes made during the transaction
        if (!this.db) {
            throw new Error('Database not connected.');
        }
        await this.db.exec('ROLLBACK;');
    }
}