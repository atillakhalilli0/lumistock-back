import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/appError.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, ...(err.details ? { details: err.details } : {}) },
    });
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  return res.status(500).json({ error: { message, code: 'INTERNAL_ERROR' } });
}