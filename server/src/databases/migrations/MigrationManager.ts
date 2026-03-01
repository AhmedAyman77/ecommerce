import { Migration } from "../../types/db.types";
import { DatabaseConnection } from "../connection/DBConnections";

// Strategy interface - defines how migrations should be executed
export interface MigrationStrategy {
    shouldExecute(migration: Migration, executedIds: number[]): boolean;
    executeUp(migration: Migration, connection: DatabaseConnection): Promise<void>;
    executeDown(migration: Migration, connection: DatabaseConnection): Promise<void>;
}


// Default safe strategy - only runs migrations that haven't been executed
class SafeMigrationStrategy implements MigrationStrategy {
    shouldExecute(migration: Migration, executedIds: number[]): boolean {
        return !executedIds.includes(migration.id);
    }

    async executeUp(migration: Migration, connection: DatabaseConnection): Promise<void> {
        await migration.up(connection);
    }

    async executeDown(migration: Migration, connection: DatabaseConnection): Promise<void> {
        await migration.down(connection);
    }
}

/**
 * Dry-run strategy - simulates migrations without actually executing them
 * Useful for testing and validation
 */
export class DryRunMigrationStrategy implements MigrationStrategy {
    shouldExecute(migration: Migration, executedIds: number[]): boolean {
        return !executedIds.includes(migration.id);
    }

    async executeUp(_migration: Migration, _connection: DatabaseConnection): Promise<void> {
        // Do nothing - just simulate
        await Promise.resolve();
    }

    async executeDown(_migration: Migration, _connection: DatabaseConnection): Promise<void> {
        // Do nothing - just simulate
        await Promise.resolve();
    }
}

// Pattern: Defines the skeleton of migration execution algorithm
// Allows subclasses to redefine certain steps without changing the overall structure
export class MigrationManager {
    private connection: DatabaseConnection;
    private migrations: Migration[];
    // Strategy Pattern - execution strategy (default: safe mode)
    private strategy: MigrationStrategy;

    constructor(
        connection: DatabaseConnection,
        migrations: Migration[],
        strategy?: MigrationStrategy
    ) {
        this.connection = connection;
        // Ensure migrations are sorted by ID (ascending)
        this.migrations = migrations.sort((a, b) => a.id - b.id);
        // Use provided strategy or default to safe mode
        this.strategy = strategy || new SafeMigrationStrategy();
    }

    /**
     * Strategy Pattern - Change execution strategy at runtime
     */
    public setStrategy(strategy: MigrationStrategy): void {
        this.strategy = strategy;
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

    /**
     * Template Method Pattern - Defines the migration execution flow
     * Each step follows a consistent structure
     */
    async runMigrations(): Promise<void> {
        await this.initialize();
        const executedMigrations = await this.getExecutedMigrations();

        for (const migration of this.migrations) {
            // Strategy Pattern - Ask strategy if we should execute
            if (this.strategy.shouldExecute(migration, executedMigrations)) {
                console.log(`Running migration ${migration.id}: ${migration.name}`);
                
                try {
                    await this.connection.beginTransaction();
                    
                    // Strategy Pattern - Execute using current strategy
                    await this.strategy.executeUp(migration, this.connection);
                    
                    // Record migration (skip for dry-run)
                    if (!(this.strategy instanceof DryRunMigrationStrategy)) {
                        await this.connection.execute(
                            'INSERT INTO migrations (id, name) VALUES (?, ?)',
                            [migration.id, migration.name]
                        );
                    }
                    
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

    /**
     * Template Method Pattern - Defines the rollback flow
     */
    async rollback(steps: number = 1): Promise<void> {
        const executedMigrations = await this.getExecutedMigrations();
        const toRollback = executedMigrations.slice(-steps).reverse();

        for (const migrationId of toRollback) {
            const migration = this.migrations.find(m => m.id === migrationId);
            if (migration) {
                console.log(`Rolling back migration ${migration.id}: ${migration.name}`);
                
                try {
                    await this.connection.beginTransaction();
                    
                    // Strategy Pattern - Execute down migration
                    await this.strategy.executeDown(migration, this.connection);
                    
                    // Remove migration record (skip for dry-run)
                    if (!(this.strategy instanceof DryRunMigrationStrategy)) {
                        await this.connection.execute(
                            'DELETE FROM migrations WHERE id = ?',
                            [migration.id]
                        );
                    }
                    
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