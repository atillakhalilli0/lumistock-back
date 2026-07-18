import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';

export async function listWarehouses(companyId?: string) {
  let q = supabase.from('warehouses').select('*');
  if (companyId) q = q.eq('company_id', companyId);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function getWarehouseById(id: string) {
  const { data, error } = await supabase.from('warehouses').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Warehouse not found');
  return data;
}

export async function createWarehouse(input: Record<string, unknown>) {
  const { data, error } = await supabase.from('warehouses').insert(input).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function updateWarehouse(id: string, input: Record<string, unknown>) {
  await getWarehouseById(id);
  const { data, error } = await supabase.from('warehouses').update(input).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function deleteWarehouse(id: string) {
  await getWarehouseById(id);
  const { error } = await supabase.from('warehouses').delete().eq('id', id);
  if (error) throw AppError.badRequest(error.message);
}

// Zones

export async function listZones(warehouseId: string) {
  const { data, error } = await supabase.from('warehouse_zones').select('*').eq('warehouse_id', warehouseId);
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function createZone(warehouseId: string, input: Record<string, unknown>) {
  await getWarehouseById(warehouseId);
  const { data, error } = await supabase
    .from('warehouse_zones')
    .insert({ ...input, warehouse_id: warehouseId })
    .select()
    .single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

// Shelves

export async function getZoneById(id: string) {
  const { data, error } = await supabase.from('warehouse_zones').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Zone not found');
  return data;
}

export async function listShelves(zoneId: string) {
  const { data, error } = await supabase.from('warehouse_shelves').select('*').eq('zone_id', zoneId);
  if (error) throw AppError.internal(error.message);
  return data ?? [];
}

export async function createShelf(zoneId: string, input: Record<string, unknown>) {
  await getZoneById(zoneId);
  const { data, error } = await supabase
    .from('warehouse_shelves')
    .insert({ ...input, zone_id: zoneId })
    .select()
    .single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}