# E-Commerce Store API (TypeScript)

A full-featured Node.js + Express backend for an e-commerce store with authentication, product management, cart, coupons, payments (Stripe), analytics, caching (Redis), image uploads (Cloudinary), and a portable SQL layer via a DAO + Factory pattern with SQLite or SQL Server implementations.

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Design Patterns](#design-patterns)
  - [Folder Structure](#folder-structure)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Database Switching](#database-switching)
- [Data Model](#data-model)
- [Database Migrations](#database-migrations)
- [Caching](#caching)
- [Media Uploads](#media-uploads)
- [Payments](#payments)
- [Authentication](#authentication)
- [Types](#types)
- [API](#api)
  - [Auth](#auth)
  - [Products](#products)
  - [Cart](#cart)
  - [Coupons](#coupons)
  - [Payments](#payments-endpoints)
  - [Analytics](#analytics)
- [Swagger UI](#swagger-ui)
- [Running Locally](#running-locally)
- [Scripts](#scripts)
- [Security Notes](#security-notes)

## Overview
This service exposes RESTful APIs for core e-commerce functionality. It supports multiple SQL backends (SQLite and SQL Server) behind a clean DAO interface so business logic stays database-agnostic. Operational concerns like authentication, caching, file uploads, and payments are covered via focused modules.

## Tech Stack
- Runtime: Node.js, TypeScript
- Web: Express
- Auth: JWT (access + refresh) via cookies
- Cache: Redis
- DB: SQLite or SQL Server (DAO pattern)
- Migrations: Custom manager and migration files
- Media: Cloudinary
- Payments: Stripe
- Docs: Swagger UI (OpenAPI 3)

## Architecture
Core layering:
- Routes → Controllers → DAO → Connection
- Config and utilities for cross-cutting concerns (env, cache, uploads, payments).

### Design Patterns
- **DAO Pattern:** Domain-specific interfaces (`UserDAO`, `ProductDAO`, `OrderDAO`, `CouponDAO`) abstract persistence. See [src/databases/DAO](src/databases/DAO).
- **Abstract Factory:** `DAOFactory` selects proper DAO implementations and `DatabaseConnection` based on env. See [src/databases/DAOFactory.ts](src/databases/DAOFactory.ts#L1).
- **Strategy (Connection):** `SQLiteConnection` and `SQLServerConnection` implement a uniform `DatabaseConnection` interface. See [src/databases/connection/DBConnections.ts](src/databases/connection/DBConnections.ts#L1).
- **Migration Manager:** Orchestrates ordered migration execution with transaction safety. See [src/databases/migrations/MigrationManager.ts](src/databases/migrations/MigrationManager.ts#L1).
- **Middleware:** `requireAuth` and `requireAdmin` enforce security policies at the route layer. See [src/middlewares/auth.middleware.ts](src/middlewares/auth.middleware.ts).

### Folder Structure
Key paths:
- App entry: [src/app.ts](src/app.ts)
- Config: [src/config](src/config)
- DB: [src/databases](src/databases)
- Controllers: [src/controllers](src/controllers)
- Routes: [src/routes](src/routes)
- Middleware: [src/middlewares](src/middlewares)
- Types: [src/types](src/types)

## Configuration
See [src/config/env.config.ts](src/config/env.config.ts#L1) for env mapping.

### Environment Variables
- Server: `PORT`, `CLIENT_URL`
- JWT: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`
- DB selection: `SQL_TYPE` (`sqlite` | `sqlserver`)
- SQLite: `SQLITE_DB_PATH`
- SQL Server: `SQLSERVER_HOST`, `SQLSERVER_DATABASE`, `SQLSERVER_USER`, `SQLSERVER_PASSWORD`, `SQLSERVER_ENCRYPT`, `SQLSERVER_TRUST_CERT`
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Stripe: `STRIPE_SECRET`

### Database Switching
Configure in `.env` via `SQL_TYPE`. Factory and connection config read from [src/config/db.config.ts](src/config/db.config.ts#L1-L50). `DAOFactory` wires matching DAOs.

## Data Model
- `users`: `_id`, `name`, `email`, `password`, `role`, `cartItems` (JSON), timestamps.
- `products`: `_id`, `name`, `description`, `price`, `image`, `category`, `isFeatured`, timestamps.
- `orders`: `_id`, `user`, `products` (JSON with `{ product, quantity, price }[]`), `totalAmount`, `stripeSessionId`, timestamps.
- `coupons`: `_id`, `code`, `discountPercentage`, `expirationDate`, `isActive`, `userId`, timestamps.

See migrations:
- [users](src/databases/migrations/migrations/001_create_users_table.ts)
- [products](src/databases/migrations/migrations/002_create_products_table.ts)
- [orders](src/databases/migrations/migrations/003_create_orders_table.ts)
- [coupons](src/databases/migrations/migrations/004_create_coupons_table.ts)

## Database Migrations
- Manager: [MigrationManager](src/databases/migrations/MigrationManager.ts#L1)
- Index of migrations: [src/databases/migrations/index.ts](src/databases/migrations/index.ts)
- Runs on startup in [src/app.ts](src/app.ts#L26-L35).

Transactions protect each migration. Applied migrations recorded in a `migrations` table with IDs and names.

## Caching
- Redis client: [src/config/redis.ts](src/config/redis.ts)
- Keys used:
  - `featured_products`: cached list for GET `/api/products/featured`
  - `refresh_token:<userId>`: store refresh tokens

## Media Uploads
- Cloudinary config: [src/config/cloudinary.ts](src/config/cloudinary.ts)
- `createProduct` uploads base64 image to `products` folder, stores `secure_url`.

## Payments
- Stripe lazy init: [src/config/stripe.ts](src/config/stripe.ts)
- Checkout flow: [src/controllers/payment.controller.ts](src/controllers/payment.controller.ts)
  - Creates checkout `session` with line items and optional discount.
  - On success, deactivates used coupon and records order.

## Authentication
- Tokens: Short-lived access (`15m`) and long-lived refresh (`7d`) via cookies.
- Flow: `signup`, `login`, `logout`, `refresh-token` in [auth.controller.ts](src/controllers/auth.controller.ts)
- Middleware:
  - `requireAuth`: Parses `accessToken` cookie, loads `req.user` via DAO.
  - `requireAdmin`: Checks `req.user.role === 'admin'`.

## Types
- Express augmentation: [src/types/express.d.ts](src/types/express.d.ts) adds `Request.user?: Partial<User>`.
- Domain models: [src/types/models.types.ts](src/types/models.types.ts)
- DB types: [src/types/db.types.ts](src/types/db.types.ts)

## API
### Auth
- POST `/api/auth/signup` → create user, set cookies. Controller: [signup](src/controllers/auth.controller.ts#L32)
- POST `/api/auth/login` → authenticate, set cookies. Controller: [login](src/controllers/auth.controller.ts#L65)
- POST `/api/auth/logout` → clear cookies, delete refresh token in Redis. Controller: [logout](src/controllers/auth.controller.ts#L101)
- POST `/api/auth/refresh-token` → refresh access token. Controller: [refreshToken](src/controllers/auth.controller.ts#L125)
- GET `/api/auth/profile` → current user (requires auth). Controller: [getProfile](src/controllers/auth.controller.ts#L163)

### Products
- GET `/api/products` → list all. Controller: [getAllProducts](src/controllers/product.controller.ts#L7)
- GET `/api/products/featured` → cached featured. Controller: [getFeaturedProducts](src/controllers/product.controller.ts#L18)
- POST `/api/products` → create (admin). Controller: [createProduct](src/controllers/product.controller.ts#L39)
- DELETE `/api/products/{id}` → delete (admin). Controller: [deleteProduct](src/controllers/product.controller.ts#L69)
- GET `/api/products/recommended` → random selection. Controller: [getRecommendedProducts](src/controllers/product.controller.ts#L112)
- GET `/api/products/category/{category}` → filter by category. Controller: [getProductsByCategory](src/controllers/product.controller.ts#L132)
- POST `/api/products/toggle-featured/{id}` → toggle featured (admin). Controller: [toggleFeaturedProduct](src/controllers/product.controller.ts#L141)

### Cart (auth required)
- GET `/api/cart` → current user cart. Controller: [getCartProducts](src/controllers/cart.controller.ts#L6)
- POST `/api/cart/add` → add by productId. Controller: [addToCart](src/controllers/cart.controller.ts#L36)
- POST `/api/cart/remove` → remove one or clear all. Controller: [removeAllFromCart](src/controllers/cart.controller.ts#L56)
- POST `/api/cart/update` → update quantity. Controller: [updateQuantity](src/controllers/cart.controller.ts#L79)

### Coupons
- POST `/api/coupons` → get user’s coupon (admin in route file; adjust per needs). Controller: [getCoupon](src/controllers/coupon.controller.ts#L6)
- POST `/api/coupons/apply` → validate coupon by code. Controller: [validateCoupon](src/controllers/coupon.controller.ts#L20)

### Payments
- POST `/api/payments/checkout` → create Stripe session (auth). Controller: [createCheckoutSession](src/controllers/payment.controller.ts#L8)
- POST `/api/payments/success` → finalize order after Stripe success. Controller: [checkoutSuccess](src/controllers/payment.controller.ts#L62)

### Analytics (auth + admin)
- GET `/api/analytics` → overview: users, products, sales, revenue. Controller: [getAnalyticsData](src/controllers/analytics.controller.ts#L7)
- GET `/api/analytics/daily?startDate&endDate` → daily series. Controller: [getDailySalesData](src/controllers/analytics.controller.ts#L30)

## Swagger UI
- Served at `/api-docs` (configured in [src/app.ts](src/app.ts#L18-L23)).
- Security: `cookieAuth` uses HttpOnly cookie `accessToken`. Click "Authorize" in Swagger and set an `accessToken` value to test protected endpoints from the browser.
- Central paths and schemas are defined in [src/config/swagger.ts](src/config/swagger.ts).

## Running Locally
1. Install deps
```bash
npm install
```
2. Create `.env` (example)
```env
PORT=3000
CLIENT_URL=http://localhost:5173
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
SQL_TYPE=sqlite
SQLITE_DB_PATH=./database.sqlite
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET=sk_test_...
```
3. Start dev server
```bash
npm run dev
```
4. Open docs
- http://localhost:3000/api-docs

## Scripts
- `dev`: Run with nodemon and ts-node.

## Security Notes
- Cookies are HttpOnly and `sameSite=strict`; set `secure=true` in production.
- Do not expose secrets in logs.
- Validate/escape user input on create/update product.
- Consider rate limiting for auth endpoints.

---

See ERD and relational notes in [ERD.md](ERD.md).
