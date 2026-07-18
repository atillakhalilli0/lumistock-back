import { Router } from 'express';
import * as controller from '../../controllers/public/stocks.controller.js';

const router = Router();

/**
 * openapi
 * /public/v1/stock/{productId}:
 *   get:
 *     summary: Current stock level for a product
 *     description: Returns the total quantity across all warehouses/batches for a product, plus a per-warehouse breakdown.
 *     tags: [Stock]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stock level
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product_id: { type: string, format: uuid }
 *                 product_name: { type: string, example: "Keratin Repair Shampoo 500ml" }
 *                 sku: { type: string, example: "KRS-500" }
 *                 total_quantity: { type: integer, example: 128 }
 *                 per_warehouse:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       warehouse_id: { type: string, format: uuid }
 *                       warehouse_name: { type: string, example: "Main Warehouse - Baku" }
 *                       quantity: { type: integer, example: 90 }
 *       404:
 *         description: Product not found
 */
router.get('/:productId', controller.getStockForProduct);

export default router;