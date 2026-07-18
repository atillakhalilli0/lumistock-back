import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

export async function listAuditLogs(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('audit_logs').select('*', { count: 'exact' });
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.module) q = q.eq('module', String(query.module));
  if (query.action) q = q.eq('action', String(query.action));
  if (query.user_name) q = q.eq('user_name', String(query.user_name));
  if (query.from) q = q.gte('created_at', String(query.from));
  if (query.to) q = q.lte('created_at', String(query.to));
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}