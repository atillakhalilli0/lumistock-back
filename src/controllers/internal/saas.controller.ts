import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/saas.service.js';
import { IdRequest } from '../../utils/http.js';

export async function listCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listSaasCompanies(req.query));
  } catch (err) {
    next(err);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await service.createSaasCompany(req.body);
    req.auditContext = { companyId: company.id, module: 'saas_companies', action: 'create', newValue: company };
    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const company = await service.updateSaasCompany(req.params.id, req.body);
    req.auditContext = { companyId: company.id, module: 'saas_companies', action: 'update', newValue: company };
    res.json(company);
  } catch (err) {
    next(err);
  }
}

export async function listPlans(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listPlans());
  } catch (err) {
    next(err);
  }
}

export async function createPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await service.createPlan(req.body);
    req.auditContext = { module: 'subscription_plans', action: 'create', newValue: plan };
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
}

export async function getMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getSaasMetrics());
  } catch (err) {
    next(err);
  }
}