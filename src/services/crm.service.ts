import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';

// ---------- Campaigns ----------

export async function listCampaigns(companyId?: string) {
  let q = supabase.from('campaigns').select('*');
  if (companyId) q = q.eq('company_id', companyId);
  const { data, error } = await q.order('start_date', { ascending: false });
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function createCampaign(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('campaigns').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

// ---------- Follow-ups ----------

export async function listFollowUps(query: Record<string, unknown>) {
  let q = supabase.from('follow_ups').select('*');
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.customer_id) q = q.eq('customer_id', String(query.customer_id));
  if (query.status) q = q.eq('status', String(query.status));
  const { data, error } = await q.order('due_date', { ascending: true });
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function createFollowUp(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('follow_ups').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateFollowUp(id: string, input: Record<string, unknown>) {
  const { data, error } = await supabase.from('follow_ups').update(input).eq('id', id).select().single();
  if (error || !data) throw AppError.notFound('Follow-up not found');
  return data;
}

// ---------- Loyalty ----------

export async function getLoyaltyForCustomer(customerId: string) {
  const { data, error } = await supabase.from('loyalty_points').select('*').eq('customer_id', customerId).maybeSingle();
  if (error) throw AppError.internal(error.message);
  return data ?? { customer_id: customerId, points_balance: 0, updated_at: null };
}