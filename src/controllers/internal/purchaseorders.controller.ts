import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/purchaseorders.service.js';
import { IdRequest } from '../../utils/http.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listPurchaseOrders(req.query));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getPurchaseOrderById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const po = await service.createPurchaseOrder(req.body);
    req.auditContext = { companyId: po.company_id, module: 'purchase_orders', action: 'create', newValue: po };
    res.status(201).json(po);
  } catch (err) {
    next(err);
  }
}

export async function update(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const po = await service.updatePurchaseOrder(req.params.id, req.body);
    req.auditContext = { companyId: po.company_id, module: 'purchase_orders', action: 'update', newValue: po };
    res.json(po);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: IdRequest, res: Response, next: NextFunction) {
  try {
    await service.deletePurchaseOrder(req.params.id);
    req.auditContext = { module: 'purchase_orders', action: 'delete', detail: `Deleted PO ${req.params.id}` };
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function receive(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const result = await service.receivePurchaseOrder(req.params.id);
    req.auditContext = {
      companyId: result.purchaseOrder.company_id,
      module: 'purchase_orders',
      action: 'receive',
      newValue: result,
    };
    res.json(result);
  } catch (err) {
    next(err);
  }
}