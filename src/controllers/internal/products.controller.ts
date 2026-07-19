import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/products.service.js';
import { AppError } from '../../utils/appError.js';
import { IdRequest } from '../../utils/http.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listProducts(req.query));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getProductById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function lookupByBarcode(req: Request, res: Response, next: NextFunction) {
  try {
    const barcode = req.query.barcode as string;
    if (!barcode) throw AppError.badRequest('barcode query param is required');
    res.json(await service.getProductByBarcode(barcode, req.query.company_id as string | undefined));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await service.createProduct(req.body);
    req.auditContext = { companyId: product.company_id, module: 'products', action: 'create', newValue: product };
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function update(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const before = await service.getProductById(req.params.id);
    const product = await service.updateProduct(req.params.id, req.body);
    req.auditContext = {
      companyId: product.company_id,
      module: 'products',
      action: 'update',
      oldValue: before,
      newValue: product,
    };
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: IdRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteProduct(req.params.id);
    req.auditContext = { module: 'products', action: 'delete', detail: `Deleted product ${req.params.id}` };
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}