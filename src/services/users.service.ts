import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

export async function listUsers(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('users').select('*', { count: 'exact' });
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.role) q = q.eq('role', String(query.role));
  if (query.status) q = q.eq('status', String(query.status));
  const { data, error, count } = await q.range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function getUserById(id: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('User not found');
  return data;
}

export async function createUser(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('users').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateUser(id: string, input: Record<string, unknown>) {
  await getUserById(id);
  const { data, error } = await supabase.from('users').update(input).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function deleteUser(id: string) {
  await getUserById(id);
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw AppError.badRequest(error.message);
}