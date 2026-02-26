import { DatabaseConfig, DatabaseType } from "../types/db.types";
import { env } from "./env.config";

function createDatabaseConfig(): DatabaseConfig {
    const dbType = env.SQL_TYPE as DatabaseType || DatabaseType.sqlite;

    switch (dbType) {
        case DatabaseType.sqlite:
            return {
                type: DatabaseType.sqlite,
                filename: env.SQLITE_DB_PATH || './database.sqlite',
            };
        
        case DatabaseType.sqlserver:
                return {
                    type: DatabaseType.sqlserver,
                    server: env.SQLSERVER_HOST || 'localhost',
                    database: env.SQLSERVER_DATABASE || 'ecommerce',
                    user: env.SQLSERVER_USER || 'sa',
                    password: env.SQLSERVER_PASSWORD || '',
                    options: {
                        encrypt: env.SQLSERVER_ENCRYPT === 'true',
                        trustServerCertificate: env.SQLSERVER_TRUST_CERT === 'true',
                    },
                }

        default:
            throw new Error(`Unsupported database type: ${dbType}`);
    }
}

export const databaseConfig = createDatabaseConfig();