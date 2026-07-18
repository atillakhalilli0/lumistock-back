import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/pos.service.js';

export async function checkout(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.checkout(req.body);
    req.auditContext = {
      companyId: result.order.company_id,
      module: 'pos',
      action: 'checkout',
      newValue: { order_number: result.invoice.order_number, total: result.invoice.total },
    };
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}