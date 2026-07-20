import { NextFunction, Request, Response } from "express";
import * as service from "../../services/dashboard.service.js";

export async function getKpis(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(
      await service.getDashboardKpis(req.query.company_id as string | undefined)
    );
  } catch (err) {
    next(err);
  }
}

export async function getSalesChart(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(
      await service.getSalesChart(
        req.query.company_id as string | undefined,
        req.query.range as string | undefined
      )
    );
  } catch (err) {
    next(err);
  }
}

export async function getCashFlow(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(
      await service.getCashFlow(
        req.query.company_id as string | undefined,
        req.query.range as string | undefined
      )
    );
  } catch (err) {
    next(err);
  }
}

export async function getBestSellers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(
      await service.getBestSellers(req.query.company_id as string | undefined)
    );
  } catch (err) {
    next(err);
  }
}

export async function getLowStock(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(
      await service.getLowStock(req.query.company_id as string | undefined)
    );
  } catch (err) {
    next(err);
  }
}

export async function getOverduePayments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(
      await service.getOverduePayments(
        req.query.company_id as string | undefined
      )
    );
  } catch (err) {
    next(err);
  }
}

export async function getRecentTransactions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(
      await service.getRecentTransactions(
        req.query.company_id as string | undefined
      )
    );
  } catch (err) {
    next(err);
  }
}