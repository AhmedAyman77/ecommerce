import sql from 'mssql';
import { DatabaseConnection } from './DBConnections';

export class SQLServerConnection implements DatabaseConnection {
    private pool: sql.ConnectionPool | null = null;
    private config: sql.config;
    private transaction: sql.Transaction | null = null;

    constructor(config: sql.config) {
        this.config = config;
    }

    async connect(): Promise<void> {
        this.pool = await new sql.ConnectionPool(this.config).connect();
    }

    async disconnect(): Promise<void> {
        if (this.pool) {
            await this.pool.close();
            this.pool = null;
        }
    }

    getConnection(): sql.ConnectionPool {
        if (!this.pool) {
            throw new Error('Database not connected');
        }
        return this.pool;
    }

    async query(sqlQuery: string, params?: any[]): Promise<any> {
        if (!this.pool) {
            throw new Error('Database not connected');
        }
        const request = this.pool.request();
        
        // the input for this function will be for eaxmple:
        // await db.query('SELECT * FROM users WHERE age > @param0 AND city = @param1', [25, 'Cairo']);
        if (params) {
            params.forEach((param, index) => {
                // this do the following:
                // request.input('param0', 25);
                // request.input('param1', 'Cairo');
                request.input(`param${index}`, param);
            });
        }

        // then when we call request.query, it will replace the placeholders with the actual values
        const result = await request.query(sqlQuery);

        // the return value is:
        /*
        {
            recordset: [
                {id: 1, name: 'Ahmed', age: 30, city: 'Cairo'},
                {id: 2, name: 'Fatima', age: 28, city: 'Cairo'}
            ],
            rowsAffected: [2],
            output: {},
            returnValue: 0
        }
        */
        return result.recordset;
    }

    async execute(sqlQuery: string, params?: any[]): Promise<any> {
        if (!this.pool) {
            throw new Error('Database not connected');
        }
        const request = this.pool.request();
        
        if (params) {
            params.forEach((param, index) => {
                request.input(`param${index}`, param);
            });
        }

        return request.query(sqlQuery);
    }

    async beginTransaction(): Promise<void> {
        if (!this.pool) {
            throw new Error('Database not connected');
        }
        this.transaction = new sql.Transaction(this.pool);
        await this.transaction.begin();
    }

    async commit(): Promise<void> {
        if (!this.transaction) {
            throw new Error('No active transaction');
        }
        await this.transaction.commit();
        this.transaction = null;
    }

    async rollback(): Promise<void> {
        if (!this.transaction) {
            throw new Error('No active transaction');
        }
        await this.transaction.rollback();
        this.transaction = null;
    }
}