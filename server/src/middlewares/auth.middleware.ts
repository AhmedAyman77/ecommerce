import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { DAOFactory } from '../databases/DAOFactory';
import { User } from '../types/models.types';

interface TokenPayload {
  userId: string;
}

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer'
}

class AuthService {
  constructor(private userDAO: any) {}
  extractToken(req: Request): string | null {
    // Try cookie first
    if (req.cookies?.accessToken) {
      return req.cookies.accessToken;
    }
    
    // Try Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.ACCESS_TOKEN_SECRET!) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async loadUser(userId: string): Promise<User | null> {
    return await this.userDAO.findById(userId);
  }

  async authenticate(req: Request): Promise<User> {
    const token = this.extractToken(req);
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = this.verifyToken(token);
    const user = await this.loadUser(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

const userDAO = DAOFactory.getInstance().getUserDAO();
const authService = new AuthService(userDAO);

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.authenticate(req);
    req.user = user;
    next();
  } catch (error: any) {
    console.error('Error in requireAuth middleware:', error.message);
    
    // Provide specific error messages
    if (error.message === 'No token provided') {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    if (error.message === 'User not found') {
      return res.status(401).json({ message: 'Unauthorized - User not found' });
    }
    
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
}

/**
 * Role-based authorization factory (Factory Pattern)
 * Creates middleware for specific role requirements
 */
function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - User not authenticated' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ 
        message: `Forbidden - ${role} access required` 
      });
    }

    next();
  };
}

export const requireAdmin = requireRole(UserRole.ADMIN);

export const requireCustomer = requireRole(UserRole.CUSTOMER);
