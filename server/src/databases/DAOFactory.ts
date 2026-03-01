import { DatabaseConnection } from './connection/DBConnections';
import { SQLiteConnection } from './connection/SQLiteConnection';
import { SQLServerConnection } from './connection/SQLServerConnection';

import { CouponDAO } from './DAO/CouponDAO';
import { OrderDAO } from './DAO/OrderDAO';
import { ProductDAO } from './DAO/ProductDAO';
import { UserDAO } from './DAO/UserDAO';

import { SQLiteCouponDAO } from './implementations/sqlite/SQLiteCouponDAO';
import { SQLiteOrderDAO } from './implementations/sqlite/SQLiteOrderDAO';
import { SQLiteProductDAO } from './implementations/sqlite/SQLiteProductDAO';
import { SQLiteUserDAO } from './implementations/sqlite/SQLiteUserDAO';

import { SQLServerCouponDAO } from './implementations/sqlserver/SQLServerCouponDAO';
import { SQLServerOrderDAO } from './implementations/sqlserver/SQLServerOrderDAO';
import { SQLServerProductDAO } from './implementations/sqlserver/SQLServerProductDAO';
import { SQLServerUserDAO } from './implementations/sqlserver/SQLServerUserDAO';

import { databaseConfig } from '../config/db.config';
import { DatabaseType } from '../types/db.types';

export class DAOFactory {
    private static instance: DAOFactory;
    private connection: DatabaseConnection;
    private userDAO: UserDAO | null = null;
    private productDAO: ProductDAO | null = null;
    private orderDAO: OrderDAO | null = null;
    private couponDAO: CouponDAO | null = null;

    private constructor() {
        switch (databaseConfig.type) {
            case DatabaseType.sqlite:
                this.connection = new SQLiteConnection(databaseConfig.filename);
                break;
            
            case DatabaseType.sqlserver:
                this.connection = new SQLServerConnection({
                    server: databaseConfig.server,
                    database: databaseConfig.database,
                    user: databaseConfig.user,
                    password: databaseConfig.password,
                    options: databaseConfig.options,
                });
                break;
            
            default:
                // ?? return RHS if LHS is null or undefined
                throw new Error(`Unsupported database type: ${(databaseConfig as any).type ?? 'unknown'}`);
        }
    }

    // Singleton instance retrieval
    // make sure only one instance of DAOFactory exists in the entire application
    public static getInstance(): DAOFactory {
        if (!DAOFactory.instance) {
            DAOFactory.instance = new DAOFactory();
        }
        return DAOFactory.instance;
    }

    public async connect(): Promise<void> {
        await this.connection.connect();
    }

    public async disconnect(): Promise<void> {
        await this.connection.disconnect();
    }

    public getUserDAO(): UserDAO {
        if (!this.userDAO) {
            if (databaseConfig.type === DatabaseType.sqlite) {
                this.userDAO = new SQLiteUserDAO(this.connection);
            } else {
                this.userDAO = new SQLServerUserDAO(this.connection);
            }
        }
        return this.userDAO;
    }

    public getProductDAO(): ProductDAO {
        if (!this.productDAO) {
            if (databaseConfig.type === DatabaseType.sqlite) {
            this.productDAO = new SQLiteProductDAO(this.connection);
        } else {
            this.productDAO = new SQLServerProductDAO(this.connection);
        }
        }
        return this.productDAO;
    }

    public getOrderDAO(): OrderDAO {
        if (!this.orderDAO) {
            if (databaseConfig.type === DatabaseType.sqlite) {
            this.orderDAO = new SQLiteOrderDAO(this.connection);
        } else {
            this.orderDAO = new SQLServerOrderDAO(this.connection);
        }
        }
        return this.orderDAO;
    }

    public getCouponDAO(): CouponDAO {
        if (!this.couponDAO) {
            if (databaseConfig.type === DatabaseType.sqlite) {
            this.couponDAO = new SQLiteCouponDAO(this.connection);
        } else {
            this.couponDAO = new SQLServerCouponDAO(this.connection);
        }
        }
        return this.couponDAO;
    }

    public getConnection(): DatabaseConnection {
        return this.connection;
    }
}