import arcjet, { fixedWindow, shield } from '@arcjet/node';
import helmet from 'helmet';
import { validateRequest } from 'zod-express-middleware';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';

// helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  frameguard:{ action: 'deny' },
  hsts: env.NODE_ENV === 'production' ? { maxAge: 31_536_000, includeSubDomains: true } : false,
  referrerPolicy: { policy: 'no-referrer' },
});

// rate limiting with Arcjet
function makeArcjetLimiter(max: number, windowSeconds: number) {
  return arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
      fixedWindow({ mode: 'LIVE', max, window: `${windowSeconds}s` }),
      shield({ mode: 'LIVE' }),
    ],
  });
}

const limiters = {
  login: makeArcjetLimiter(10, 60),
  signup: makeArcjetLimiter(5, 60),
  checkout: makeArcjetLimiter(20, 60),
  search: makeArcjetLimiter(60, 60),
  global: makeArcjetLimiter(200, 60),
};

function makeMiddleware(limiter: ReturnType<typeof arcjet>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const decision = await limiter.protect(req);
    if (decision.isDenied()) {
      return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
    }
    next();
  };
}

export const rateLimit = {
  login: makeMiddleware(limiters.login),
  signup: makeMiddleware(limiters.signup),
  checkout: makeMiddleware(limiters.checkout),
  search: makeMiddleware(limiters.search),
  global: makeMiddleware(limiters.global),
};


// zod validation schemas
const schemas = {
  signup: {
    body: z.object({
      name: z.string().min(2).max(64),
      email: z.string().email(),
      password: z.string().min(8).max(128)
        .regex(/[A-Z]/, 'Password needs an uppercase letter')
        .regex(/[0-9]/, 'Password needs a number'),
    }),
  },

  login: {
    body: z.object({
      email:z.string().email(),
      password:z.string().min(1).max(128),
    }),
  },

  createProduct: {
    body: z.object({
      name: z.string().min(2).max(128),
      description: z.string().min(1).max(2000),
      price: z.coerce.number().positive().max(999_999),
      category: z.string(),
      image: z.string().url().optional(),
    }),
  },

  productId: {
    params: z.object({
      id: z.string().min(1).max(64),
    }),
  },

  search: {
    query: z.object({
      q: z.string().min(1).max(200),
      category: z.string().max(64).optional(),
    }),
  },

  checkout: {
    body: z.object({
      products: z.array(z.object({
        _id: z.string().min(1).max(64),
        name: z.string().min(1).max(128),
        image: z.string().url().optional(),
        price: z.number().positive().max(999_999),
        quantity: z.number().int().min(1).max(999),
      })).min(1),
      couponCode: z.string().max(32).regex(/^[a-zA-Z0-9]*$/).toUpperCase().optional().nullable(),
    }),
  },

  checkoutSuccess: {
    body: z.object({
      sessionId: z.string().min(1).max(128),
    }),
  },

  cartItem: {
    body: z.object({
      productId: z.string().min(1).max(64),
    }),
  },

  updateQuantity: {
    params: z.object({ productId: z.string().min(1).max(64) }),
    body: z.object({ quantity: z.number().int().min(0).max(999) }),
  },

  couponValidate: {
    body: z.object({
      code: z.string().min(1).max(32).regex(/^[a-zA-Z0-9]*$/),
    }),
  },
};

export const rules = {
  signup: validateRequest(schemas.signup),
  login: validateRequest(schemas.login),
  createProduct: validateRequest(schemas.createProduct),
  productId: validateRequest(schemas.productId),
  search: validateRequest(schemas.search),
  checkout: validateRequest(schemas.checkout),
  checkoutSuccess: validateRequest(schemas.checkoutSuccess),
  cartItem: validateRequest(schemas.cartItem),
  updateQuantity: validateRequest(schemas.updateQuantity),
  couponValidate: validateRequest(schemas.couponValidate),
};
