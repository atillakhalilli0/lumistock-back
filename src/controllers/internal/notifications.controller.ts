import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/notifications.service.js';
import { AppError } from '../../utils/appError.js';
import { IdRequest } from '../../utils/http.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listNotifications(req.query));
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const notification = await service.markNotificationRead(req.params.id);
    req.auditContext = { companyId: notification.company_id, module: 'notifications', action: 'mark_read' };
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.body.company_id as string | undefined;
    if (!companyId) throw AppError.badRequest('company_id is required');
    const notifications = await service.markAllNotificationsRead(companyId);
    req.auditContext = { companyId, module: 'notifications', action: 'mark_all_read' };
    res.json({ updated: notifications.length, notifications });
  } catch (err) {
    next(err);
  }
}

export async function listRules(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listNotificationRules(req.query.company_id as string | undefined));
  } catch (err) {
    next(err);
  }
}

export async function putRule(req: Request, res: Response, next: NextFunction) {
  try {
    const rule = req.body.id
      ? await service.updateNotificationRule(req.body.id, req.body)
      : await service.upsertNotificationRule(req.body);
    req.auditContext = { companyId: rule.company_id, module: 'notification_rules', action: 'upsert', newValue: rule };
    res.json(rule);
  } catch (err) {
    next(err);
  }
}