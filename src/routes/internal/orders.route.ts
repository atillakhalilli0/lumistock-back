import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/orders.controller.js';

const router = Router();

const orderSchema = z.object({
  company_id: z.string().uuid(),
  order_number: z.string().min(1),
  customer_id: z.string().uuid().optional(),
  status: z.string().optional(),
  payment_method: z.string().optional(),
  payment_status: z.string().optional(),
  subtotal: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  cargo_ref: z.string().optional(),
  created_by: z.string().optional(),
});
const orderUpdateSchema = orderSchema.partial();

const statusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'completed', 'cancelled']),
});

router.get('/', controller.list);
router.post('/', validate(orderSchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validate(orderUpdateSchema), controller.update);
router.delete('/:id', controller.remove);
router.patch('/:id/status', validate(statusSchema), controller.updateStatus);

export default router;