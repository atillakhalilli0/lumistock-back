import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/notifications.controller.js';

const router = Router();

const markAllSchema = z.object({ company_id: z.string().uuid() });

const ruleSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  rule_type: z.enum(['low_stock', 'payment_overdue', 'expiry_warning', 'daily_report']),
  threshold: z.number().optional(),
  enabled: z.boolean().optional(),
});

router.get('/notifications', controller.list);
router.patch('/notifications/:id/read', controller.markRead);
router.patch('/notifications/read-all', validate(markAllSchema), controller.markAllRead);

router.get('/notification-rules', controller.listRules);
router.put('/notification-rules', validate(ruleSchema), controller.putRule);

export default router;