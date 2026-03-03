import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { redisClient } from '../config/redis';
import { DAOFactory } from '../databases/DAOFactory';
import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '../types/error.types';

const userDAO = DAOFactory.getInstance().getUserDAO();

interface TokenPayload {
  userId: string;
}

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, env.ACCESS_TOKEN_SECRET!, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign({ userId }, env.REFRESH_TOKEN_SECRET!, {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId: string, refreshToken: string) => {
  await redisClient.setEx(`refresh_token:${userId}`, 7 * 24 * 60 * 60, refreshToken);
};

const setCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export async function signup(req: Request, res: Response) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ValidationError('Name, email, and password are required');
  }
  
  const existing = await userDAO.findByEmail(email);
  if (existing) {
    throw new ConflictError('User already exists');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await userDAO.create({
    name,
    email,
    password: hashed,
    role: 'customer',
    cartItems: [],
  });

  const { accessToken, refreshToken } = generateTokens(user._id!);
  await storeRefreshToken(user._id!, refreshToken);
  setCookies(res, accessToken, refreshToken);

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  
  if(!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const user = await userDAO.findByEmail(email);

  if (!user) {
    // Invalid email or password prevents brute-force attacks by not revealing which one is incorrect
    throw new AuthenticationError('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  const { accessToken, refreshToken } = generateTokens(user._id!);
  await storeRefreshToken(user._id!, refreshToken);
  setCookies(res, accessToken, refreshToken);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}

export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET!) as TokenPayload;
      await redisClient.del(`refresh_token:${decoded.userId}`);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
}

export async function refreshToken(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token missing');
  }

  const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET!) as TokenPayload;
  const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);

  if (storedToken !== refreshToken) {
    throw new AuthenticationError('Invalid refresh token');
  }

  const accessToken = jwt.sign({ userId: decoded.userId }, env.ACCESS_TOKEN_SECRET!, {
    expiresIn: '15m',
  });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.json({ message: 'Token refreshed successfully' });
}

export async function getProfile(req: Request, res: Response) {
  if(!req.user) {
    throw new NotFoundError('User not found');
  }
  res.json(req.user);
}