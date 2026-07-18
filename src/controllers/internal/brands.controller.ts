import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/brands.service.js';
import { IdRequest } from '../../utils/http.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listBrands(req.query.company_id as string | undefined));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getBrandById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const brand = await service.createBrand(req.body);
    req.auditContext = { companyId: brand.company_id, module: 'brands', action: 'create', newValue: brand };
    res.status(201).json(brand);
  } catch (err) {
    next(err);
  }
}

export async function update(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const brand = await service.updateBrand(req.params.id, req.body);
    req.auditContext = { companyId: brand.company_id, module: 'brands', action: 'update', newValue: brand };
    res.json(brand);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: IdRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteBrand(req.params.id);
    req.auditContext = { module: 'brands', action: 'delete', detail: `Deleted brand ${req.params.id}` };
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}