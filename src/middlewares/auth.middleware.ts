import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { DAOFactory } from '../databases/DAOFactory';

interface TokenPayload {
  userId: string;
}

const userDAO = DAOFactory.getInstance().getUserDAO();

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.accessToken;
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as TokenPayload;
    const user = await userDAO.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;

    next();
  } catch (error: any) {
    console.error('Error in requireAuth middleware', error.message);
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }
  next();
}