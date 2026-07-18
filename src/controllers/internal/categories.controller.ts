import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/categories.service.js';
import { IdRequest } from '../../utils/http.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listCategories(req.query.company_id as string | undefined));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getCategoryById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.createCategory(req.body);
    req.auditContext = { companyId: category.company_id, module: 'categories', action: 'create', newValue: category };
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export async function update(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const category = await service.updateCategory(req.params.id, req.body);
    req.auditContext = { companyId: category.company_id, module: 'categories', action: 'update', newValue: category };
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: IdRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteCategory(req.params.id);
    req.auditContext = { module: 'categories', action: 'delete', detail: `Deleted category ${req.params.id}` };
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}