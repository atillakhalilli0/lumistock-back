import { Router } from 'express';
import * as controller from '../../controllers/public/orders.controller.js';

const router = Router();

/**
 * @openapi
 * /public/v1/orders/{idOrOrderNumber}:
 *   get:
 *     summary: Order status lookup
 *     description: >
 *       Look up a single order by its id or order_number. There is no listing/search
 *       endpoint for orders in the public API, to avoid leaking the full order book —
 *       this is lookup-only.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: idOrOrderNumber
 *         required: true
 *         schema: { type: string }
 *         description: Either the order's UUID or its order_number (e.g. POS-20260718120000-4821)
 *     responses:
 *       200:
 *         description: Order status and totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string, format: uuid }
 *                 order_number: { type: string, example: "POS-20260718120000-4821" }
 *                 status: { type: string, example: "completed" }
 *                 payment_method: { type: string, example: "credit" }
 *                 payment_status: { type: string, example: "unpaid" }
 *                 subtotal: { type: number, example: 150.0 }
 *                 discount: { type: number, example: 10.0 }
 *                 total: { type: number, example: 140.0 }
 *                 order_items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id: { type: string, format: uuid }
 *                       quantity: { type: integer, example: 3 }
 *                       unit_price: { type: number, example: 50.0 }
 *                       discount: { type: number, example: 0 }
 *                       line_total: { type: number, example: 150.0 }
 *       404:
 *         description: Order not found
 */
router.get('/:idOrOrderNumber', controller.getOne);

export default router;