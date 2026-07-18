import { NextFunction, Request, Response } from 'express';
import * as service from '../../services/reports.service.js';
import { AppError } from '../../utils/appError.js';
import { ReportRequest } from '../../utils/http.js';

export async function getReport(req: ReportRequest, res: Response, next: NextFunction) {
  try {
    const { type } = req.params;
    const data = await service.getReport(type, req.query);
    res.json({ type, data });
  } catch (err) {
    next(err);
  }
}

export async function exportReport(req: ReportRequest, res: Response, next: NextFunction) {
  try {
    const { type } = req.params;
    const format = (req.query.format as string) ?? 'csv';
    if (format !== 'csv') throw AppError.badRequest('Only format=csv is currently supported');

    const data = await service.getReport(type, req.query);
    const csv = service.toCsv(data as Record<string, unknown>[]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}