export enum DatabaseType {
    sqlite = 'sqlite',
    sqlserver = 'sqlserver'
}

// Discriminated Union Pattern
export type DatabaseConfig = SQLiteConfig | SQLServerConfig;

interface SQLiteConfig{
    type: DatabaseType.sqlite;
    filename: string;
}
interface SQLServerConfig{
    type: DatabaseType.sqlserver;
    server: string;
    database: string;
    user: string;
    password: string;
    options?: {
        encrypt?: boolean;
        trustServerCertificate?: boolean;
    };
}

export interface Migration {
    id: number;
    name: string;
    up: (connection: any) => Promise<void>;
    down: (connection: any) => Promise<void>;
}