import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/warehouses.controller.js';

const router = Router();

const warehouseSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1),
  location: z.string().optional(),
  status: z.string().optional(),
});
const warehouseUpdateSchema = warehouseSchema.partial();

const zoneSchema = z.object({ code: z.string().min(1), name: z.string().optional() });
const shelfSchema = z.object({
  code: z.string().min(1),
  row_label: z.string().optional(),
  col_label: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  current_fill: z.number().int().min(0).optional(),
});

router.get('/warehouses', controller.listWarehouses);
router.post('/warehouses', validate(warehouseSchema), controller.createWarehouse);
router.get('/warehouses/:id', controller.getWarehouse);
router.patch('/warehouses/:id', validate(warehouseUpdateSchema), controller.updateWarehouse);
router.delete('/warehouses/:id', controller.deleteWarehouse);

router.get('/warehouses/:id/zones', controller.listZones);
router.post('/warehouses/:id/zones', validate(zoneSchema), controller.createZone);

router.get('/zones/:id/shelves', controller.listShelves);
router.post('/zones/:id/shelves', validate(shelfSchema), controller.createShelf);

export default router;