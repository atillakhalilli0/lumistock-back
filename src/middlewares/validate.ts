import { NextFunction, Request, Response } from 'express';
import { ZodType, ZodError } from 'zod';
import { AppError } from '../utils/appError.js';

type ValidateTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodType, target: ValidateTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[target]);
      (req as any)[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(AppError.badRequest('Validation failed', err.flatten()));
      }
      next(err);
    }
  };
}