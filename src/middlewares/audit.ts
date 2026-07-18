import { NextFunction, Request, Response } from 'express';
import { supabase } from '../lib/supabaseClient.js';

export interface AuditContext {
  companyId?: string;
  userName?: string;
  module?: string;
  action?: string;
  detail?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auditContext?: AuditContext;
    }
  }
}

/**
 * Wraps every non-GET /internal/v1 route. After the response finishes with a
 * success status, inserts an audit_logs row using whatever context the
 * controller attached to req.auditContext.
 */
export function auditLogger(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET') return next();

  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const ctx = req.auditContext;
      const companyId = ctx?.companyId ?? (req.body?.company_id as string | undefined);

      supabase
        .from('audit_logs')
        .insert({
          company_id: companyId ?? null,
          user_name: ctx?.userName ?? 'system',
          action: ctx?.action ?? req.method,
          module: ctx?.module ?? req.baseUrl.split('/').pop(),
          detail: ctx?.detail ?? `${req.method} ${req.originalUrl}`,
          old_value: ctx?.oldValue ?? null,
          new_value: ctx?.newValue ?? null,
          ip_address: req.ip,
        })
        .then(({ error }) => {
          if (error) {
            // eslint-disable-next-line no-console
            console.error('Audit log insert failed:', error.message);
          }
        });
    }
  });

  next();
}