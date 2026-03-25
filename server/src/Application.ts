import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application as ExpressApp } from 'express';
import { Server } from 'http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.config';
import { swaggerSpec } from './config/swagger';
import { DAOFactory } from './databases/DAOFactory';
import { MigrationManager } from './databases/migrations/MigrationManager';
import { migrations } from './databases/migrations/index';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { initElasticsearch } from './config/elasticsearch';
import { esProductDAO } from './databases/implementations/elasticsearch/ElasticsearchProductDAO';
import authRoutes from './routes/auth.route';
import cartRoutes from './routes/cart.route';
import couponRoutes from './routes/coupon.route';
import paymentRoutes from './routes/payment.route';
import productRoutes from './routes/product.route';
import { securityHeaders, rateLimit } from './middlewares/security.middleware';
import './types/express';

export class Application {
    private app: ExpressApp;
    private daoFactory: DAOFactory;
    private server?: Server;
    private isShuttingDown: boolean = false;

    constructor() {
        this.app = express();
        this.daoFactory = DAOFactory.getInstance();
    }

    private configureMiddleware(): void {
        this.app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
        this.app.use(securityHeaders);
        this.app.use(rateLimit.global);
        this.app.use(express.json({limit: '10mb'}));
        this.app.use(cookieParser());

        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }

    private configureRoutes(): void {
        // API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/products', productRoutes);
        this.app.use('/api/cart', cartRoutes);
        this.app.use('/api/coupons', couponRoutes);
        this.app.use('/api/payments', paymentRoutes);

        this.app.get('/api/health', (_, res) => {
            res.json({ 
                ok: true,
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        this.app.use(notFoundHandler);
        this.app.use(errorHandler);
    }

    private async initializeDatabase(rollback: boolean): Promise<void> {
        try {
            await this.daoFactory.connect();
            const migrationManager = new MigrationManager(
                this.daoFactory.getConnection(),
                migrations
            );
            if(!rollback) {
                await migrationManager.runMigrations();
                console.log('Database migrations completed');
            } else {
                await migrationManager.rollback();
                console.log('Database rollback completed');
            }
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    private async initializeElasticSearch(): Promise<void> {
        try {
            await initElasticsearch();

            // Sync existing products to Elasticsearch
            const productDAO = this.daoFactory.getProductDAO();
            const allProducts = await productDAO.findAll();
            await esProductDAO.bulkIndex(allProducts);
        } catch (error) {
            console.error('Failed to initialize Elasticsearch:', error);
        }
    }

    private async shutdownDatabase(): Promise<void> {
        try {
            console.log('Closing database connection...');
            await this.daoFactory.disconnect();
            console.log('Database connection closed');
        } catch (error) {
            console.error('Error closing database connection:', error);
            throw error;
        }
    }

    public async start(): Promise<void> {
        try {
            this.configureMiddleware();
            this.configureRoutes();

            await this.initializeDatabase(false);
            await this.initializeElasticSearch();
            this.server = this.app.listen(env.PORT, () => {
                console.log(`Server running on port ${env.PORT}`);
                console.log(`API Documentation: http://localhost:${env.PORT}/api-docs`);
            });

            this.setupGracefulShutdown();
        } catch (error) {
            console.error('Failed to start application:', error);
            process.exit(1);
        }
    }

    public async stop(): Promise<void> {
        if (this.isShuttingDown) {
            console.log('Shutdown already in progress...');
            return;
        }

        this.isShuttingDown = true;
        console.log('Shutting down gracefully...');

        if (this.server) {
            this.server.close(async () => {
                console.log('HTTP server closed');

                try {
                    await this.shutdownDatabase();
                    console.log('Shutdown complete');
                    process.exit(0);
                } catch (error) {
                    console.error('Error during shutdown:', error);
                    process.exit(1);
                }
            });
        }

        // Force shutdown after timeout
        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    }

    private setupGracefulShutdown(): void {
        // Handle termination signals

        process.on('SIGTERM', () => {
            console.log('\nSIGTERM received');
            this.stop();
        });

        process.on('SIGINT', () => {
            console.log('\nSIGINT received');
            this.stop();
        });

        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.stop();
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.stop();
        });
    }
}
