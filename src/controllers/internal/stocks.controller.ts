import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/stocks.service.js';

export async function listMovements(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listMovements(req.query));
  } catch (err) {
    next(err);
  }
}

export async function stockIn(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.stockIn(req.body);
    req.auditContext = {
      companyId: req.body.company_id,
      module: 'stock',
      action: 'stock_in',
      newValue: result,
    };
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function stockTransfer(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.stockTransfer(req.body);
    req.auditContext = {
      companyId: req.body.company_id,
      module: 'stock',
      action: 'stock_transfer',
      newValue: result,
    };
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function stockAdjust(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.stockAdjust(req.body);
    req.auditContext = {
      companyId: req.body.company_id,
      module: 'stock',
      action: 'stock_adjust',
      newValue: result,
    };
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}