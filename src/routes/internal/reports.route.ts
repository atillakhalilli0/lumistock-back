import { Router } from 'express';
import * as controller from '../../controllers/internal/reports.controller.js';

const router = Router();

// GET /reports/:type/export?format=csv must be registered before the bare /:type route
router.get('/:type/export', controller.exportReport);
router.get('/:type', controller.getReport);

export default router;