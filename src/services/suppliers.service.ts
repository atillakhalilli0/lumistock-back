import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';

export async function listSuppliers(companyId?: string) {
  let q = supabase.from('suppliers').select('*');
  if (companyId) q = q.eq('company_id', companyId);
  const { data, error } = await q;
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function getSupplierById(id: string) {
  const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Supplier not found');
  return data;
}

export async function createSupplier(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('suppliers').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateSupplier(id: string, input: Record<string, unknown>) {
  await getSupplierById(id);
  const { data, error } = await supabase.from('suppliers').update(input).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function deleteSupplier(id: string) {
  await getSupplierById(id);
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw AppError.badRequest(error.message);
}