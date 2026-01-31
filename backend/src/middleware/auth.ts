import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { CustomError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  technicianId?: string;
  customerId?: string;
  refreshToken?: string;
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
  technicianId?: string;
  customerId?: string;
  type: 'access' | 'refresh';
}

/**
 * Verify JWT token and attach user info to request
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      
      if (decoded.type !== 'access') {
        throw new CustomError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
      }

      // Verify user still exists and ensure technicianId/customerId are set (for old tokens)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true },
      });

      if (!user) {
        throw new CustomError('User not found', 401, 'USER_NOT_FOUND');
      }

      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.technicianId = decoded.technicianId;
      req.customerId = decoded.customerId;

      // Fallback: if token is missing technicianId/customerId, fetch from DB (e.g. old tokens)
      if (user.role === 'TECHNICIAN' && !req.technicianId) {
        const technician = await prisma.technician.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        req.technicianId = technician?.id;
      }
      if (user.role === 'CUSTOMER' && !req.customerId) {
        const customer = await prisma.customer.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        req.customerId = customer?.id;
      }

      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new CustomError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new CustomError('Invalid token', 401, 'INVALID_TOKEN');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Require specific role(s)
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return next(new CustomError('Not authenticated', 401, 'NOT_AUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.userRole)) {
      return next(new CustomError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};

/**
 * Require ownership - customers can only access their own data
 */
export const requireOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.userRole === 'ADMIN') {
      return next(); // Admins can access everything
    }

    if (req.userRole === 'CUSTOMER' && req.customerId) {
      // Customer can only access their own data
      // This will be checked in individual route handlers
      return next();
    }

    if (req.userRole === 'TECHNICIAN' && req.technicianId) {
      // Technicians can access their linked customers' data
      // This will be checked in individual route handlers
      return next();
    }

    throw new CustomError('Access denied', 403, 'ACCESS_DENIED');
  } catch (error) {
    next(error);
  }
};

/**
 * Generate access and refresh tokens
 */
export function generateTokens(payload: Omit<TokenPayload, 'type'>): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
    
    if (decoded.type !== 'refresh') {
      throw new CustomError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new CustomError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
    }
    throw new CustomError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
}
