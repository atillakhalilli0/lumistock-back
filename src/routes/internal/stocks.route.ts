import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/stocks.controller.js';

const router = Router();

const stockInSchema = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  shelf_id: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  batch_number: z.string().optional(),
  expire_date: z.string().optional(),
  buy_price: z.number().nonnegative().optional(),
  supplier_id: z.string().uuid().optional(),
  reference_doc: z.string().optional(),
  operator_name: z.string().optional(),
  note: z.string().optional(),
});

const stockTransferSchema = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  from_warehouse_id: z.string().uuid(),
  to_warehouse_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  operator_name: z.string().optional(),
  note: z.string().optional(),
  reference_doc: z.string().optional(),
});

const stockAdjustSchema = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  quantity: z.number().int().refine((v) => v !== 0, 'quantity must be non-zero'),
  operator_name: z.string().optional(),
  note: z.string().optional(),
  reference_doc: z.string().optional(),
});

router.get('/movements', controller.listMovements);
router.post('/in', validate(stockInSchema), controller.stockIn);
router.post('/transfer', validate(stockTransferSchema), controller.stockTransfer);
router.post('/adjust', validate(stockAdjustSchema), controller.stockAdjust);

export default router;