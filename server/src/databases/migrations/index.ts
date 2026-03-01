import { createUsersTable } from './migrations/001_create_users_table';
import { createProductsTable } from './migrations/002_create_products_table';
import { createOrdersTable } from './migrations/003_create_orders_table';
import { createCouponsTable } from './migrations/004_create_coupons_table';

export const migrations = [
    createUsersTable,
    createProductsTable,
    createOrdersTable,
    createCouponsTable,
];