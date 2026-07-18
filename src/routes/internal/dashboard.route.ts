import { Router } from "express";
import * as controller from "../../controllers/internal/dashboard.controller.js";

const router = Router();

router.get("/kpis", controller.getKpis);

router.get("/sales-chart", controller.getSalesChart);

router.get("/cash-flow", controller.getCashFlow);

router.get("/best-sellers", controller.getBestSellers);

router.get("/low-stock", controller.getLowStock);

router.get("/overdue-payments", controller.getOverduePayments);

router.get("/recent-transactions", controller.getRecentTransactions);

export default router;