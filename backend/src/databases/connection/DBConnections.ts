export interface DatabaseConnection {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getConnection(): any;
    query(sql: string, params?: any[]): Promise<any>;
    execute(sql: string, params?: any[]): Promise<any>;
    beginTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
}