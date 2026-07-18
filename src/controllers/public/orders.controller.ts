import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/orders.service.js';

type OrderRequest = Request<{ idOrOrderNumber: string }>;

export async function getOne(req: OrderRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getOrderByIdOrNumberPublic(req.params.idOrOrderNumber));
  } catch (err) {
    next(err);
  }
}