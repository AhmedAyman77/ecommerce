export enum DatabaseType {
    sqlite = 'sqlite',
    sqlserver = 'sqlserver'
}

export interface DatabaseConfig {
    type: DatabaseType;
    sqlite?: {
        filename: string;
    };
    sqlserver?: {
        server: string;
        database: string;
        user: string;
        password: string;
        options?: {
            encrypt?: boolean;
            trustServerCertificate?: boolean;
        };
    };
}

export interface Migration {
    id: number;
    name: string;
    up: (connection: any) => Promise<void>;
    down: (connection: any) => Promise<void>;
}