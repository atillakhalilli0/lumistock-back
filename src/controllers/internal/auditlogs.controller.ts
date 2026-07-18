import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/auditlogs.service.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listAuditLogs(req.query));
  } catch (err) {
    next(err);
  }
}