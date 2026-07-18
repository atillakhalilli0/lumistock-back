import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';

const REPORT_VIEWS: Record<string, string> = {
  sales: 'v_sales_report',
  profit: 'v_profit_report',
  stock: 'v_stock_report',
  debt: 'v_debt_report',
  'employee-performance': 'v_employee_performance_report',
  'product-performance': 'v_product_performance_report',
};

const DATE_COLUMN: Record<string, string | null> = {
  sales: 'day',
  profit: 'day',
  stock: null,
  debt: null,
  'employee-performance': null,
  'product-performance': null,
};

export function isValidReportType(type: string): boolean {
  return type in REPORT_VIEWS;
}

export async function getReport(type: string, query: Record<string, unknown>) {
  if (!isValidReportType(type)) {
    throw AppError.badRequest(`Unknown report type: ${type}. Valid types: ${Object.keys(REPORT_VIEWS).join(', ')}`);
  }

  const view = REPORT_VIEWS[type];
  const dateColumn = DATE_COLUMN[type];

  let q = supabase.from(view).select('*');
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (dateColumn && query.from) q = q.gte(dateColumn, String(query.from));
  if (dateColumn && query.to) q = q.lte(dateColumn, String(query.to));

  const { data, error } = await q;
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))];
  return lines.join('\n');
}