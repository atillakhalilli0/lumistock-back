import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/suppliers.service.js';
import { IdRequest } from '../../utils/http.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listSuppliers(req.query.company_id as string | undefined));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getSupplierById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const supplier = await service.createSupplier(req.body);
    req.auditContext = { companyId: supplier.company_id, module: 'suppliers', action: 'create', newValue: supplier };
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
}

export async function update(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const supplier = await service.updateSupplier(req.params.id, req.body);
    req.auditContext = { companyId: supplier.company_id, module: 'suppliers', action: 'update', newValue: supplier };
    res.json(supplier);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: IdRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteSupplier(req.params.id);
    req.auditContext = { module: 'suppliers', action: 'delete', detail: `Deleted supplier ${req.params.id}` };
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}