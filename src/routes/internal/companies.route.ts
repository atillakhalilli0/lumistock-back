import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/companies.controller.js';

const router = Router();

const companyBodySchema = z.object({
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

const companyUpdateSchema = companyBodySchema.partial();

router.get('/', controller.listCompanies);
router.post('/', validate(companyBodySchema), controller.createCompany);
router.get('/:id', controller.getCompany);
router.patch('/:id', validate(companyUpdateSchema), controller.updateCompany);

export default router;