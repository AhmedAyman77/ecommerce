import { DatabaseConfig, DatabaseType } from "../types/db.types";
import { env } from "./env.config";

export const databaseConfig: DatabaseConfig = {
    type: (env.SQL_TYPE as DatabaseType) || DatabaseType.sqlite,
    sqlite: {
        filename: env.SQLITE_DB_PATH || './database.sqlite',
    },
    sqlserver: {
        server: env.SQLSERVER_HOST || 'localhost',
        database: env.SQLSERVER_DATABASE || 'ecommerce',
        user: env.SQLSERVER_USER || 'sa',
        password: env.SQLSERVER_PASSWORD || '',
        options: {
            encrypt: env.SQLSERVER_ENCRYPT === 'true',
            trustServerCertificate: env.SQLSERVER_TRUST_CERT === 'true',
        },
    },
}