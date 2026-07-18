import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

export interface CompanyInput {
  name: string;
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_regime?: string;
  plan_id?: string;
  status?: string;
  country?: string;
}

export async function listCompanies(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('companies').select('*', { count: 'exact' });
  if (query.status) q = q.eq('status', String(query.status));
  if (query.search) q = q.ilike('name', `%${query.search}%`);
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function getCompanyById(id: string) {
  const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Company not found');
  return data;
}

export async function createCompany(input: CompanyInput) {
  const { data, error } = await supabase.from('companies').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateCompany(id: string, input: Partial<CompanyInput>) {
  await getCompanyById(id);
  const { data, error } = await supabase.from('companies').update(input).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}