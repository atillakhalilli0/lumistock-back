import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/stocks.service.js';

type StockRequest = Request<{ productId: string }>;

export async function getStockForProduct(
  req: StockRequest,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await service.getStockForProductPublic(req.params.productId));
  } catch (err) {
    next(err);
  }
}