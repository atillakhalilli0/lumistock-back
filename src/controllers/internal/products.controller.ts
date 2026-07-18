import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/orders.service.js';
import { IdRequest } from '../../utils/http.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listOrders(req.query));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getOrderById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await service.createOrder(req.body);
    req.auditContext = { companyId: order.company_id, module: 'orders', action: 'create', newValue: order };
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function update(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const order = await service.updateOrder(req.params.id, req.body);
    req.auditContext = { companyId: order.company_id, module: 'orders', action: 'update', newValue: order };
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: IdRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteOrder(req.params.id);
    req.auditContext = { module: 'orders', action: 'delete', detail: `Deleted order ${req.params.id}` };
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const order = await service.updateOrderStatus(req.params.id, req.body.status);
    req.auditContext = {
      companyId: order.company_id,
      module: 'orders',
      action: 'status_change',
      newValue: { status: order.status },
    };
    res.json(order);
  } catch (err) {
    next(err);
  }
}