import { DatabaseConnection } from '../connection/DBConnections';

export abstract class BaseDAO<T> {
    protected connection: DatabaseConnection;

    constructor(connection: DatabaseConnection) {
        this.connection = connection;
    }

    abstract create(item: T): Promise<T>;
    abstract findById(id: string): Promise<T | null>;
    abstract findAll(): Promise<T[]>;
    abstract update(id: string, item: Partial<T>): Promise<T | null>;
    abstract delete(id: string): Promise<boolean>;
}