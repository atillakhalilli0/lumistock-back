import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/customers.service.js';
import { IdRequest } from '../../utils/http.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listCustomers(req.query));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getCustomerById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await service.createCustomer(req.body);
    req.auditContext = { companyId: customer.company_id, module: 'customers', action: 'create', newValue: customer };
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
}

export async function update(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const customer = await service.updateCustomer(req.params.id, req.body);
    req.auditContext = { companyId: customer.company_id, module: 'customers', action: 'update', newValue: customer };
    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: IdRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteCustomer(req.params.id);
    req.auditContext = { module: 'customers', action: 'delete', detail: `Deleted customer ${req.params.id}` };
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getPrices(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getCustomerPrices(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function putPrice(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const price = await service.upsertCustomerPrice(req.params.id, req.body);
    req.auditContext = { module: 'customer_product_prices', action: 'upsert', newValue: price };
    res.json(price);
  } catch (err) {
    next(err);
  }
}