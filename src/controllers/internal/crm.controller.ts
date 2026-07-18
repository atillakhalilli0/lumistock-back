import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/crm.service.js';
import { IdRequest, CustomerRequest } from '../../utils/http.js';

export async function listCampaigns(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listCampaigns(req.query.company_id as string | undefined));
  } catch (err) {
    next(err);
  }
}

export async function createCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const campaign = await service.createCampaign(req.body);
    req.auditContext = { companyId: campaign.company_id, module: 'campaigns', action: 'create', newValue: campaign };
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
}

export async function listFollowUps(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listFollowUps(req.query));
  } catch (err) {
    next(err);
  }
}

export async function createFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const followUp = await service.createFollowUp(req.body);
    req.auditContext = { companyId: followUp.company_id, module: 'follow_ups', action: 'create', newValue: followUp };
    res.status(201).json(followUp);
  } catch (err) {
    next(err);
  }
}

export async function updateFollowUp(req: IdRequest, res: Response, next: NextFunction) {
  try {
    const followUp = await service.updateFollowUp(req.params.id, req.body);
    req.auditContext = { companyId: followUp.company_id, module: 'follow_ups', action: 'update', newValue: followUp };
    res.json(followUp);
  } catch (err) {
    next(err);
  }
}

export async function getLoyalty(req: CustomerRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getLoyaltyForCustomer(req.params.customerId));
  } catch (err) {
    next(err);
  }
}