import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/debts.controller.js';

const router = Router();

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

router.get('/customers', controller.listCustomerDebts);
router.post('/customers/:id/payments', validate(paymentSchema), controller.payCustomerDebt);

router.get('/suppliers', controller.listSupplierDebts);
router.post('/suppliers/:id/payments', validate(paymentSchema), controller.paySupplierDebt);

export default router;