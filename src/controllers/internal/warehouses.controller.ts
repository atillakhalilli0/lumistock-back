import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/warehouses.service.js';
import { IdRequest } from '../../utils/http.js';

export async function listWarehouses(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listWarehouses(req.query.company_id as string | undefined));
  } catch (err) {
    next(err);
  }
}

export async function getWarehouse(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getWarehouseById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createWarehouse(req: Request, res: Response, next: NextFunction) {
  try {
    const warehouse = await service.createWarehouse(req.body);
    req.auditContext = { companyId: warehouse.company_id, module: 'warehouses', action: 'create', newValue: warehouse };
    res.status(201).json(warehouse);
  } catch (err) {
    next(err);
  }
}

export async function updateWarehouse(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const warehouse = await service.updateWarehouse(req.params.id, req.body);
    req.auditContext = { companyId: warehouse.company_id, module: 'warehouses', action: 'update', newValue: warehouse };
    res.json(warehouse);
  } catch (err) {
    next(err);
  }
}

export async function deleteWarehouse(req: IdRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteWarehouse(req.params.id);
    req.auditContext = { module: 'warehouses', action: 'delete', detail: `Deleted warehouse ${req.params.id}` };
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listZones(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.listZones(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createZone(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const zone = await service.createZone(req.params.id, req.body);
    req.auditContext = { module: 'warehouse_zones', action: 'create', newValue: zone };
    res.status(201).json(zone);
  } catch (err) {
    next(err);
  }
}

export async function listShelves(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.listShelves(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createShelf(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const shelf = await service.createShelf(req.params.id, req.body);
    req.auditContext = { module: 'warehouse_shelves', action: 'create', newValue: shelf };
    res.status(201).json(shelf);
  } catch (err) {
    next(err);
  }
}