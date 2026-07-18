import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/crm.controller.js';

const router = Router();

const campaignSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1),
  target_segment: z.string().optional(),
  discount_type: z.string().optional(),
  discount_value: z.number().nonnegative().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
});

const followUpSchema = z.object({
  company_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  task: z.string().min(1),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.string().optional(),
  assigned_to: z.string().optional(),
});
const followUpUpdateSchema = followUpSchema.partial();

router.get('/campaigns', controller.listCampaigns);
router.post('/campaigns', validate(campaignSchema), controller.createCampaign);

router.get('/follow-ups', controller.listFollowUps);
router.post('/follow-ups', validate(followUpSchema), controller.createFollowUp);
router.patch('/follow-ups/:id', validate(followUpUpdateSchema), controller.updateFollowUp);

router.get('/loyalty/:customerId', controller.getLoyalty);

export default router;