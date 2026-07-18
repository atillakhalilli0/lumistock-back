import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

export interface ProductInput {
  company_id: string;
  name: string;
  sku: string;
  barcode?: string;
  category_id?: string;
  brand_id?: string;
  description?: string;
  buy_price?: number;
  sell_price?: number;
  corporate_price?: number;
  unit?: string;
  min_stock_threshold?: number;
  image_url?: string;
  status?: string;
}

// ---------- Internal (full detail) ----------

export async function listProducts(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('products').select('*', { count: 'exact' });
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.search) q = q.or(`name.ilike.%${query.search}%,sku.ilike.%${query.search}%`);
  if (query.category_id) q = q.eq('category_id', String(query.category_id));
  if (query.brand_id) q = q.eq('brand_id', String(query.brand_id));
  if (query.status) q = q.eq('status', String(query.status));
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function getProductById(id: string) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Product not found');
  return data;
}

export async function getProductByBarcode(barcode: string, companyId?: string) {
  let q = supabase.from('products').select('*').eq('barcode', barcode);
  if (companyId) q = q.eq('company_id', companyId);
  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw AppError.internal(error.message);
  if (!data) throw AppError.notFound('No product found for that barcode');
  return data;
}

export async function createProduct(input: ProductInput) {
  const { data, error } = await supabase.from('products').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  await getProductById(id);
  const { data, error } = await supabase.from('products').update(input).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function deleteProduct(id: string) {
  await getProductById(id);
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw AppError.badRequest(error.message);
}

// ---------- Read-only (shared with public API) ----------

export async function listProductsPublic(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase
    .from('products')
    .select('id, name, sku, barcode, category_id, brand_id, sell_price, unit, status, created_at', { count: 'exact' });

  if (query.search) q = q.or(`name.ilike.%${query.search}%,sku.ilike.%${query.search}%`);
  if (query.category) q = q.eq('category_id', String(query.category));
  if (query.updated_since) q = q.gte('created_at', String(query.updated_since));
  q = q.eq('status', 'active');

  const { data, error, count } = await q.order('created_at', { ascending: false }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function getProductByIdPublic(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, barcode, category_id, brand_id, sell_price, unit, status, description, image_url, created_at')
    .eq('id', id)
    .single();
  if (error || !data) throw AppError.notFound('Product not found');
  return data;
}