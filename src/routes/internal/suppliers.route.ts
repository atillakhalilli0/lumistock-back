import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/suppliers.controller.js';

const router = Router();

const schema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1),
  contact_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
});
const updateSchema = schema.partial();

router.get('/', controller.list);
router.post('/', validate(schema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validate(updateSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;