import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

export async function listNotifications(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('notifications').select('*', { count: 'exact' });
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.type) q = q.eq('type', String(query.type));
  if (query.is_read !== undefined) q = q.eq('is_read', query.is_read === 'true');
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function markNotificationRead(id: string) {
  const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select().single();
  if (error || !data) throw AppError.notFound('Notification not found');
  return data;
}

export async function markAllNotificationsRead(companyId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('company_id', companyId)
    .eq('is_read', false)
    .select();
  if (error) throw AppError.badRequest(error.message);
  return data ?? [];
}

// ---------- Notification rules ----------

export async function listNotificationRules(companyId?: string) {
  let q = supabase.from('notification_rules').select('*');
  if (companyId) q = q.eq('company_id', companyId);
  const { data, error } = await q;
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function upsertNotificationRule(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('notification_rules').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateNotificationRule(id: string, input: Record<string, unknown>) {
  const { data, error } = await supabase.from('notification_rules').update(input).eq('id', id).select().single();
  if (error || !data) throw AppError.notFound('Notification rule not found');
  return data;
}