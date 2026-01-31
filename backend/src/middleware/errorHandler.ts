import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'CustomError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Request error', err instanceof Error ? err : new Error(String(err)), {
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Custom application errors
  if (err instanceof CustomError) {
    return res.status(err.statusCode || 500).json({
      error: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Prisma errors
  if (err && typeof err === 'object' && 'code' in err) {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A record with this value already exists',
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
      });
    }
  }

  // Default error
  res.status(500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
