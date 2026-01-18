import { DatabaseConnection } from "../connection/DBConnections";
import { Migration } from "../../types/db.types";

export class MigrationManager {
    private connection: DatabaseConnection;
    private migrations: Migration[];

    constructor(connection: DatabaseConnection, migrations: Migration[]) {
        this.connection = connection;
        // if a.id - b.id is negative, a comes before b
        // if a.id - b.id is zero, their order remains unchanged
        this.migrations = migrations.sort((a, b) => a.id - b.id); // Ensure migrations are sorted by ID (ascending)
    }

    async initialize(): Promise<void> {
        await this.connection.query(
            `CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        );
    }

    async getExecutedMigrations(): Promise<number[]> {
        const results = await this.connection.query('SELECT id FROM migrations ORDER BY id');
        return results.map((row: any) => row.id);
    }

    async runMigrations(): Promise<void> {
        await this.initialize();
        const executedMigrations = await this.getExecutedMigrations();

        for (const migration of this.migrations) {
            if (!executedMigrations.includes(migration.id)) {
                console.log(`Running migration ${migration.id}: ${migration.name}`);
                
                try {
                    await this.connection.beginTransaction();
                    await migration.up(this.connection);
                    await this.connection.execute(
                        'INSERT INTO migrations (id, name) VALUES (?, ?)',
                        [migration.id, migration.name]
                    );
                    await this.connection.commit();
                    console.log(`Migration ${migration.id} completed successfully`);
                } catch (error) {
                    await this.connection.rollback();
                    console.error(`Migration ${migration.id} failed:`, error);
                    throw error;
                }
            }
        }
    }

    async rollback(steps: number = 1): Promise<void> {
        const executedMigrations = await this.getExecutedMigrations();
        const toRollback = executedMigrations.slice(-steps).reverse();

        for (const migrationId of toRollback) {
            const migration = this.migrations.find(m => m.id === migrationId);
            if (migration) {
                console.log(`Rolling back migration ${migration.id}: ${migration.name}`);
                
                try {
                    await this.connection.beginTransaction();
                    await migration.down(this.connection);
                    await this.connection.execute('DELETE FROM migrations WHERE id = ?', [migration.id]);
                    await this.connection.commit();
                    console.log(`Migration ${migration.id} rolled back successfully`);
                } catch (error) {
                    await this.connection.rollback();
                    console.error(`Rollback of migration ${migration.id} failed:`, error);
                    throw error;
                }
            }
        }
    }
}