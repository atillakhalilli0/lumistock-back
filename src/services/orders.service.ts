import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

export async function listOrders(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('orders').select('*', { count: 'exact' });
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.status) q = q.eq('status', String(query.status));
  if (query.customer_id) q = q.eq('customer_id', String(query.customer_id));
  if (query.payment_status) q = q.eq('payment_status', String(query.payment_status));
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Order not found');
  return data;
}

export async function createOrder(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('orders').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateOrder(id: string, input: Record<string, unknown>) {
  await getOrderById(id);
  const { data, error } = await supabase.from('orders').update(input).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function deleteOrder(id: string) {
  await getOrderById(id);
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw AppError.badRequest(error.message);
}

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

export async function updateOrderStatus(id: string, status: string) {
  if (!VALID_STATUSES.includes(status)) {
    throw AppError.badRequest(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  await getOrderById(id);
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

// ---------- Public (read-only order lookup) ----------

export async function getOrderByIdOrNumberPublic(idOrOrderNumber: string, companyId?: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrOrderNumber);

  let q = supabase
    .from('orders')
    .select(
      'id, order_number, status, payment_method, payment_status, subtotal, discount, total, created_at, order_items(product_id, quantity, unit_price, discount, line_total)'
    );

  q = isUuid ? q.eq('id', idOrOrderNumber) : q.eq('order_number', idOrOrderNumber);
  if (companyId) q = q.eq('company_id', companyId);

  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw AppError.internal(error.message);
  if (!data) throw AppError.notFound('Order not found');
  return data;
}