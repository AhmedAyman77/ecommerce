import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DAOFactory } from '../databases/DAOFactory';
import { env } from '../config/env.config';
import { redisClient } from '../config/redis';

const userDAO = DAOFactory.getInstance().getUserDAO();

interface TokenPayload {
  userId: string;
}

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign({ userId }, env.REFRESH_TOKEN_SECRET, {
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
  try {
    const { name, email, password } = req.body;
    
    const existing = await userDAO.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
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
  } catch (error: any) {
    console.error('Error in signup controller', error.message);
    res.status(500).json({ message: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await userDAO.findByEmail(email);

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
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
  } catch (error: any) {
    console.error('Error in login controller', error.message);
    res.status(500).json({ message: error.message });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as TokenPayload;
      await redisClient.del(`refresh_token:${decoded.userId}`);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Error in logout controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as TokenPayload;
    const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, env.ACCESS_TOKEN_SECRET, {
      expiresIn: '15m',
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: 'Token refreshed successfully' });
  } catch (error: any) {
    console.error('Error in refreshToken controller', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    res.json(req.user);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}