import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/pos.controller.js';

const router = Router();

const checkoutItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
});

const checkoutSchema = z.object({
  company_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  payment_method: z.enum(['cash', 'card', 'transfer', 'credit']),
  items: z.array(checkoutItemSchema).min(1),
  discount: z.number().nonnegative().optional(),
  created_by: z.string().optional(),
  cargo_ref: z.string().optional(),
});

router.post('/checkout', validate(checkoutSchema), controller.checkout);

export default router;