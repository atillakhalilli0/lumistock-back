import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from '../../controllers/internal/users.controller.js';

const router = Router();

const userSchema = z.object({
  company_id: z.string().uuid(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  avatar_url: z.string().url().optional(),
  status: z.string().optional(),
});
const userUpdateSchema = userSchema.partial();

router.get('/', controller.list);
router.post('/', validate(userSchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validate(userUpdateSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;