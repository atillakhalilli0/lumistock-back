import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/users.service.js';
import { IdRequest } from '../../utils/http.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listUsers(req.query));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getUserById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await service.createUser(req.body);
    req.auditContext = { companyId: user.company_id, module: 'users', action: 'create', newValue: user };
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function update(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const user = await service.updateUser(req.params.id, req.body);
    req.auditContext = { companyId: user.company_id, module: 'users', action: 'update', newValue: user };
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: IdRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteUser(req.params.id);
    req.auditContext = { module: 'users', action: 'delete', detail: `Deleted user ${req.params.id}` };
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}