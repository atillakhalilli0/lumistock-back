import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/debts.service.js';
import { IdRequest } from '../../utils/http.js';

export async function listCustomerDebts(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listCustomerDebts(req.query));
  } catch (err) {
    next(err);
  }
}

export async function payCustomerDebt(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const result = await service.payCustomerDebt(req.params.id, req.body);
    req.auditContext = {
      companyId: result.debt.company_id,
      module: 'customer_debts',
      action: 'payment',
      newValue: result,
    };
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listSupplierDebts(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listSupplierDebts(req.query));
  } catch (err) {
    next(err);
  }
}

export async function paySupplierDebt(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const result = await service.paySupplierDebt(req.params.id, req.body);
    req.auditContext = {
      companyId: result.debt.company_id,
      module: 'supplier_debts',
      action: 'payment',
      newValue: result,
    };
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}