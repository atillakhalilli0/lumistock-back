import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

export async function listCustomers(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('customers').select('*', { count: 'exact' });
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.type) q = q.eq('type', String(query.type));
  if (query.status) q = q.eq('status', String(query.status));
  if (query.search) q = q.ilike('name', `%${query.search}%`);
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function getCustomerById(id: string) {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Customer not found');
  return data;
}

export async function createCustomer(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('customers').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateCustomer(id: string, input: Record<string, unknown>) {
  await getCustomerById(id);
  const { data, error } = await supabase.from('customers').update(input).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function deleteCustomer(id: string) {
  await getCustomerById(id);
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw AppError.badRequest(error.message);
}

export async function getCustomerPrices(customerId: string) {
  const { data, error } = await supabase
    .from('customer_product_prices')
    .select('*, products(name, sku, sell_price)')
    .eq('customer_id', customerId);
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function upsertCustomerPrice(
  customerId: string,
  input: { product_id: string; custom_price?: number; discount_pct?: number }
) {
  const { data, error } = await supabase
    .from('customer_product_prices')
    .upsert({ customer_id: customerId, ...input }, { onConflict: 'customer_id,product_id' })
    .select()
    .single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}