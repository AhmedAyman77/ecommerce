import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.config';

const port = env.PORT;

export const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-Commerce Store API',
            version: '1.0.0',
            description: 'API documentation for the E-Commerce store',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'accessToken',
                    description: 'JWT stored in HttpOnly cookie named accessToken',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['customer', 'admin'] },
                    },
                },
                Product: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        image: { type: 'string' },
                        category: { type: 'string' },
                        isFeatured: { type: 'boolean' },
                    },
                },
                Coupon: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        code: { type: 'string' },
                        discountPercentage: { type: 'number' },
                        expirationDate: { type: 'string', format: 'date-time' },
                        isActive: { type: 'boolean' },
                        userId: { type: 'string' },
                    },
                },
                Order: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        user: { type: 'string' },
                        products: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    product: { type: 'string' },
                                    quantity: { type: 'number' },
                                    price: { type: 'number' },
                                },
                            },
                        },
                        totalAmount: { type: 'number' },
                        stripeSessionId: { type: 'string' },
                    },
                },
                CartItem: {
                    type: 'object',
                    properties: {
                        productId: { type: 'string' },
                        quantity: { type: 'number' },
                    },
                },
                CheckoutProduct: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        price: { type: 'number' },
                        image: { type: 'string' },
                        quantity: { type: 'number' },
                    },
                    required: ['_id', 'name', 'price', 'quantity'],
                },
            },
        },
        security: [{ cookieAuth: [] }],
        paths: {
        '/api/health': {
            get: {
                tags: ['Health'],
                summary: 'Health check',
                responses: {
                        200: {
                        description: 'Service is healthy',
                        content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            ok: { type: 'boolean' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/auth/signup': {
                post: {
                    tags: ['Auth'],
                    summary: 'Sign up',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'email', 'password'],
                                    properties: {
                                        name: { type: 'string' },
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'Created user',
                            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
                        },
                    },
                },
            },
            '/api/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Log in',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Authenticated user',
                            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
                        },
                    },
                },
            },
            '/api/auth/logout': {
                post: {
                    tags: ['Auth'],
                    summary: 'Log out',
                    responses: { 200: { description: 'Logged out successfully' } },
                },
            },
            '/api/auth/refresh-token': {
                post: {
                    tags: ['Auth'],
                    summary: 'Refresh access token',
                    responses: { 200: { description: 'Token refreshed successfully' } },
                },
            },
            '/api/auth/profile': {
                get: {
                    tags: ['Auth'],
                    summary: 'Get current user profile',
                    security: [{ cookieAuth: [] }],
                    responses: {
                        200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
                        401: { description: 'Unauthorized' },
                    },
                },
            },
            '/api/products': {
                get: {
                    tags: ['Products'],
                    summary: 'List all products',
                    responses: {
                        200: {
                            description: 'Products list',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ['Products'],
                    summary: 'Create a product',
                    security: [{ cookieAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'description', 'price', 'category'],
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        price: { type: 'number' },
                                        image: { type: 'string', format: 'binary' },
                                        category: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Created product', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
                        401: { description: 'Unauthorized' },
                    },
                },
            },
            '/api/products/featured': {
                get: {
                    tags: ['Products'],
                    summary: 'Get featured products',
                    responses: {
                        200: { description: 'Featured products', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } },
                    },
                },
            },
            '/api/products/{id}': {
                delete: {
                    tags: ['Products'],
                    summary: 'Delete a product',
                    security: [{ cookieAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Product deleted' }, 404: { description: 'Product not found' } },
                },
            },
            '/api/products/recommendations': {
                get: {
                    tags: ['Products'],
                    summary: 'Get recommended products',
                    responses: { 200: { description: 'Recommended products', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } } },
                },
            },
            '/api/products/search': {
                get: {
                    tags: ['Products'],
                    summary: 'Search products',
                    parameters: [{ in: 'query', name: 'q', required: true, schema: { type: 'string' }, description: 'Search query' }],
                    responses: { 
                        200: { description: 'Search results', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } },
                    },
                },
            },
            '/api/products/category/{category}': {
                get: {
                    tags: ['Products'],
                    summary: 'Get products by category',
                    parameters: [{ in: 'path', name: 'category', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: {
                            description: 'Products by category',
                            content: { 'application/json': { schema: { type: 'object', properties: { products: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } } },
                        },
                    },
                },
            },
            '/api/products/toggle-featured/{id}': {
                patch: {
                    tags: ['Products'],
                    summary: 'Toggle product featured flag',
                    security: [{ cookieAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Updated product', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } }, 404: { description: 'Product not found' } },
                },
            },
            '/api/cart': {
                get: {
                    tags: ['Cart'],
                    summary: 'Get cart products',
                    security: [{ cookieAuth: [] }],
                    responses: { 200: { description: 'Cart items' }, 401: { description: 'Unauthorized' } },
                },
                post: {
                    tags: ['Cart'],
                    summary: 'Add product to cart',
                    security: [{ cookieAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['productId'], properties: { productId: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Updated cart' }, 401: { description: 'Unauthorized' } },
                },
            },
            '/api/cart/{productId}': {
                delete: {
                    tags: ['Cart'],
                    summary: 'Remove product from cart',
                    security: [{ cookieAuth: [] }],
                    parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Updated cart' }, 401: { description: 'Unauthorized' } },
                },
                put: {
                    tags: ['Cart'],
                    summary: 'Update cart item quantity',
                    security: [{ cookieAuth: [] }],
                    parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['quantity'], properties: { quantity: { type: 'number' } } } } } },
                    responses: { 200: { description: 'Updated cart' }, 401: { description: 'Unauthorized' } },
                },
            },
            '/api/coupons': {
                get: {
                    tags: ['Coupons'],
                    summary: 'Get current user coupon',
                    security: [{ cookieAuth: [] }],
                    responses: { 200: { description: 'Coupon or null', content: { 'application/json': { schema: { oneOf: [{ $ref: '#/components/schemas/Coupon' }, { type: 'null' }] } } } } },
                },
            },
            '/api/coupons/apply': {
                post: {
                    tags: ['Coupons'],
                    summary: 'Validate coupon by code',
                    security: [{ cookieAuth: [] }],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['code'], properties: { code: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Coupon valid' }, 404: { description: 'Coupon not found or expired' } },
                },
            },
            '/api/payments/checkout': {
                post: {
                    tags: ['Payments'],
                    summary: 'Create Stripe checkout session',
                    security: [{ cookieAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['products'],
                                    properties: {
                                        products: { type: 'array', items: { $ref: '#/components/schemas/CheckoutProduct' } },
                                        couponCode: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Checkout session created' }, 401: { description: 'Unauthorized' } },
                },
            },
            '/api/payments/success': {
                post: {
                    tags: ['Payments'],
                    summary: 'Handle Stripe checkout success',
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['sessionId'], properties: { sessionId: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Order created' } },
                },
            },
            '/api/analytics': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Get analytics overview',
                    security: [{ cookieAuth: [] }],
                    responses: { 200: { description: 'Analytics overview' }, 403: { description: 'Forbidden' } },
                },
            },
            '/api/analytics/daily': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Get daily sales data',
                    security: [{ cookieAuth: [] }],
                    parameters: [
                        { in: 'query', name: 'startDate', required: true, schema: { type: 'string', format: 'date-time' } },
                        { in: 'query', name: 'endDate', required: true, schema: { type: 'string', format: 'date-time' } },
                    ],
                    responses: { 200: { description: 'Daily sales data' }, 403: { description: 'Forbidden' } },
                },
            },
        },
    },
    apis: ['src/routes/*.ts', 'src/controllers/*.ts'],
});
