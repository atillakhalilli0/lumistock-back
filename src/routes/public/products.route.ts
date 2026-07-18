import { Router } from 'express';
import * as controller from '../../controllers/public/products.controller.js';

const router = Router();

/**
 * @openapi
 * /public/v1/products:
 *   get:
 *     summary: List products (catalog sync)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *         description: Items per page (max 100)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Free-text search across name and SKU
 *       - in: query
 *         name: category
 *         schema: { type: string, format: uuid }
 *         description: Filter by category id
 *       - in: query
 *         name: updated_since
 *         schema: { type: string, format: date-time }
 *         description: Only return products created/updated at or after this ISO timestamp
 *     responses:
 *       200:
 *         description: Paginated product catalog
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string, example: "Keratin Repair Shampoo 500ml" }
 *                       sku: { type: string, example: "KRS-500" }
 *                       barcode: { type: string, example: "8690123456789" }
 *                       category_id: { type: string, format: uuid }
 *                       brand_id: { type: string, format: uuid }
 *                       sell_price: { type: number, example: 12.5 }
 *                       unit: { type: string, example: "pcs" }
 *                       status: { type: string, example: "active" }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer, example: 1 }
 *                     pageSize: { type: integer, example: 20 }
 *                     total: { type: integer, example: 42 }
 *                     totalPages: { type: integer, example: 3 }
 */
router.get('/', controller.list);

/**
 * @openapi
 * /public/v1/products/{id}:
 *   get:
 *     summary: Get a single product's detail
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string, format: uuid }
 *                 name: { type: string, example: "Keratin Repair Shampoo 500ml" }
 *                 sku: { type: string, example: "KRS-500" }
 *                 barcode: { type: string, example: "8690123456789" }
 *                 description: { type: string }
 *                 sell_price: { type: number, example: 12.5 }
 *                 unit: { type: string, example: "pcs" }
 *                 image_url: { type: string, example: "https://cdn.example.com/krs-500.jpg" }
 *                 status: { type: string, example: "active" }
 *       404:
 *         description: Product not found
 */
router.get('/:id', controller.getOne);

export default router;