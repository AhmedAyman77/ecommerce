import cookieParser from "cookie-parser";
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from "./config/env.config";
import { swaggerSpec } from './config/swagger';
import { DAOFactory } from "./databases/DAOFactory";
import { migrations } from "./databases/migrations/index";
import { MigrationManager } from "./databases/migrations/MigrationManager";
import analyticsRoutes from './routes/analytics.route';
import authRoutes from './routes/auth.route';
import cartRoutes from './routes/cart.route';
import couponRoutes from './routes/coupon.route';
import paymentRoutes from './routes/payment.route';
import productRoutes from './routes/product.route';
import './types/express';

(async () => {
    const app = express();
    app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // routes
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/coupons', couponRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/analytics', analyticsRoutes);

    // health check
    app.get('/api/health', (_, res) => res.json({ ok: true }));

    const daoFactory = DAOFactory.getInstance();
    await daoFactory.connect();
    const migrationManager = new MigrationManager(daoFactory.getConnection(), migrations);
    await migrationManager.runMigrations();

    app.listen(env.PORT, () => {
        console.log(`Server running on port ${env.PORT}`);
    });
})();