import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/products.controller.js';

const router = Router();

const productSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  brand_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  buy_price: z.number().nonnegative().optional(),
  sell_price: z.number().nonnegative().optional(),
  corporate_price: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  min_stock_threshold: z.number().int().nonnegative().optional(),
  image_url: z.string().url().optional(),
  status: z.string().optional(),
});
const productUpdateSchema = productSchema.partial();

// NOTE: /lookup must be registered before /:id so it isn't swallowed by the param route
router.get('/lookup', controller.lookupByBarcode);
router.get('/', controller.list);
router.post('/', validate(productSchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validate(productUpdateSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;