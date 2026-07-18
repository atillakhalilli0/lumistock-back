import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/saas.controller.js';

const router = Router();

const companySchema = z.object({
  name: z.string().min(1),
  tax_id: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  tax_regime: z.string().optional(),
  plan_id: z.string().uuid().optional(),
  status: z.string().optional(),
  country: z.string().optional(),
});
const companyUpdateSchema = companySchema.partial();

const planSchema = z.object({
  name: z.string().min(1),
  price_monthly: z.number().nonnegative(),
  max_users: z.number().int().positive().optional(),
  max_products: z.number().int().positive().optional(),
  max_warehouses: z.number().int().positive().optional(),
  features: z.record(z.string(), z.unknown()).optional(),
});

router.get('/companies', controller.listCompanies);
router.post('/companies', validate(companySchema), controller.createCompany);
router.patch('/companies/:id', validate(companyUpdateSchema), controller.updateCompany);

router.get('/plans', controller.listPlans);
router.post('/plans', validate(planSchema), controller.createPlan);

router.get('/metrics', controller.getMetrics);

export default router;