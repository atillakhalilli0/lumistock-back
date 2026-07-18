import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/purchaseorders.controller.js';

const router = Router();

const itemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
});

const poSchema = z.object({
  company_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  order_date: z.string().optional(),
  expected_date: z.string().optional(),
  status: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

const poUpdateSchema = z.object({
  supplier_id: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  order_date: z.string().optional(),
  expected_date: z.string().optional(),
  status: z.string().optional(),
  total_amount: z.number().nonnegative().optional(),
});

router.get('/', controller.list);
router.post('/', validate(poSchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validate(poUpdateSchema), controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/receive', controller.receive);

export default router;