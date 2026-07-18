import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/products.service.js';

type ProductRequest = Request<{ id: string }>;

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listProductsPublic(req.query));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: ProductRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getProductByIdPublic(req.params.id));
  } catch (err) {
    next(err);
  }
}