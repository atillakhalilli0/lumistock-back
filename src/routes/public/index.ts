import { Router } from 'express';
import productsRouter from './products.route.js';
import stockRouter from './stocks.route.js';
import ordersRouter from './orders.route.js';

const router = Router();

/**
 * @openapi
 * /public/v1/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', (_req, res) => res.json({ status: 'ok', api: 'public/v1', time: new Date().toISOString() }));

router.use('/products', productsRouter);
router.use('/stock', stockRouter);
router.use('/orders', ordersRouter);

export default router;