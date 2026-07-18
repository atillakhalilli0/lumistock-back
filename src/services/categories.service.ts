import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';

export async function listCategories(companyId?: string) {
  let q = supabase.from('categories').select('*');
  if (companyId) q = q.eq('company_id', companyId);
  const { data, error } = await q;
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function getCategoryById(id: string) {
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Category not found');
  return data;
}

export async function createCategory(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('categories').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateCategory(id: string, input: Record<string, unknown>) {
  await getCategoryById(id);
  const { data, error } = await supabase.from('categories').update(input).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function deleteCategory(id: string) {
  await getCategoryById(id);
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw AppError.badRequest(error.message);
}