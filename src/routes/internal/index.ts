import { Router } from 'express';
import companiesRouter from './companies.route.js';
import warehousesRouter from './warehouses.route.js';
import categoriesRouter from './categories.route.js';
import brandsRouter from './brands.route.js';
import productsRouter from './products.route.js';
import stockRouter from './stocks.route.js';
import customersRouter from './customers.route.js';
import suppliersRouter from './suppliers.route.js';
import purchaseOrdersRouter from './purchaseorders.route.js';
import ordersRouter from './orders.route.js';
import posRouter from './pos.route.js';
import debtsRouter from './debts.route.js';
import notificationsRouter from './notifications.route.js';
import crmRouter from './crm.routes.js';
import usersRouter from './users.route.js';
import auditLogsRouter from './auditlogs.route.js';
import reportsRouter from './reports.route.js';
import saasRouter from './saas.route.js';
import dashboardRouter from "./dashboard.route.js";
const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', api: 'internal', time: new Date().toISOString() }));

router.use('/companies', companiesRouter);
router.use('/', warehousesRouter); // includes /warehouses, /zones/:id/shelves nested paths
router.use('/categories', categoriesRouter);
router.use('/brands', brandsRouter);
router.use("/dashboard", dashboardRouter);
router.use('/products', productsRouter);
router.use('/stock', stockRouter);
router.use('/customers', customersRouter);
router.use('/suppliers', suppliersRouter);
router.use('/purchase-orders', purchaseOrdersRouter);
router.use('/orders', ordersRouter);
router.use('/pos', posRouter);
router.use('/debts', debtsRouter);
router.use('/', notificationsRouter); // /notifications, /notification-rules
router.use('/crm', crmRouter);
router.use('/users', usersRouter);
router.use('/audit-logs', auditLogsRouter);
router.use('/reports', reportsRouter);
router.use('/saas', saasRouter);

export default router;