import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

// ---------- Companies (platform-wide, across all tenants) ----------

export async function listSaasCompanies(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('companies').select('*, subscription_plans(name, price_monthly)', { count: 'exact' });
  if (query.status) q = q.eq('status', String(query.status));
  if (query.plan_id) q = q.eq('plan_id', String(query.plan_id));
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function createSaasCompany(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('companies').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateSaasCompany(id: string, input: Record<string, unknown>) {
  const { data, error } = await supabase.from('companies').update(input).eq('id', id).select().single();
  if (error || !data) throw AppError.notFound('Company not found');
  return data;
}

// ---------- Subscription plans ----------

export async function listPlans() {
  const { data, error } = await supabase.from('subscription_plans').select('*').order('price_monthly', { ascending: true });
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function createPlan(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('subscription_plans').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

// ---------- Platform metrics ----------

export async function getSaasMetrics() {
  const [{ count: totalCompanies }, { count: activeCompanies }, { count: totalUsers }, { count: totalProducts }, { data: plans }] =
    await Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('subscription_plans').select('id, name, price_monthly'),
    ]);

  // Companies per plan (simple aggregate — fine at this scale; move to a SQL view if it grows)
  const { data: companiesByPlan, error: cbpErr } = await supabase.from('companies').select('plan_id');
  if (cbpErr) throw AppError.internal(cbpErr.message);

  const planCounts = new Map<string, number>();
  for (const c of companiesByPlan ?? []) {
    const key = c.plan_id ?? 'none';
    planCounts.set(key, (planCounts.get(key) ?? 0) + 1);
  }

  return {
    total_companies: totalCompanies ?? 0,
    active_companies: activeCompanies ?? 0,
    total_users: totalUsers ?? 0,
    total_products: totalProducts ?? 0,
    plans: (plans ?? []).map((p) => ({ ...p, company_count: planCounts.get(p.id) ?? 0 })),
  };
}