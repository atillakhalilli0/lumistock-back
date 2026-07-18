import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';

export async function listBrands(companyId?: string) {
  let q = supabase.from('brands').select('*');
  if (companyId) q = q.eq('company_id', companyId);
  const { data, error } = await q;
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function getBrandById(id: string) {
  const { data, error } = await supabase.from('brands').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Brand not found');
  return data;
}

export async function createBrand(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('brands').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateBrand(id: string, input: Record<string, unknown>) {
  await getBrandById(id);
  const { data, error } = await supabase.from('brands').update(input).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function deleteBrand(id: string) {
  await getBrandById(id);
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw AppError.badRequest(error.message);
}