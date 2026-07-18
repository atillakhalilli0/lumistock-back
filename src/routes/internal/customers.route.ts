import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/customers.controller.js';

const router = Router();

const customerSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['retail', 'corporate', 'salon', 'distributor']).optional(),
  tax_id: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  credit_limit: z.number().nonnegative().optional(),
  price_tier: z.string().optional(),
  status: z.string().optional(),
});
const customerUpdateSchema = customerSchema.partial();

const priceSchema = z.object({
  product_id: z.string().uuid(),
  custom_price: z.number().nonnegative().optional(),
  discount_pct: z.number().min(0).max(100).optional(),
});

router.get('/', controller.list);
router.post('/', validate(customerSchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validate(customerUpdateSchema), controller.update);
router.delete('/:id', controller.remove);

router.get('/:id/prices', controller.getPrices);
router.put('/:id/prices', validate(priceSchema), controller.putPrice);

export default router;