import { NextFunction, Request, Response } from 'express';
import * as companiesService from '../../services/companies.service.js';
import { IdRequest } from '../../utils/http.js';

export async function listCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await companiesService.listCompanies(req.query));
  } catch (err) {
    next(err);
  }
}

export async function getCompany(req: IdRequest, res: Response, next: NextFunction) {
  try {
    res.json(await companiesService.getCompanyById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await companiesService.createCompany(req.body);
    req.auditContext = { companyId: company.id, module: 'companies', action: 'create', newValue: company };
    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const company = await companiesService.updateCompany(req.params.id, req.body);
    req.auditContext = { companyId: company.id, module: 'companies', action: 'update', newValue: company };
    res.json(company);
  } catch (err) {
    next(err);
  }
}