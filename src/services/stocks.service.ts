import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';
import { deductStockFifo, checkLowStockAndNotify } from '../utils/costing.js';

export async function listMovements(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('stock_movements').select('*', { count: 'exact' });
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.product_id) q = q.eq('product_id', String(query.product_id));
  if (query.type) q = q.eq('type', String(query.type));
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export interface StockInInput {
  company_id: string;
  product_id: string;
  warehouse_id: string;
  shelf_id?: string;
  quantity: number;
  batch_number?: string;
  expire_date?: string;
  buy_price?: number;
  supplier_id?: string;
  reference_doc?: string;
  operator_name?: string;
  note?: string;
}

// Receives stock into a new batch and logs an 'in' movement.
export async function stockIn(input: StockInInput) {
  const { data: batch, error: batchErr } = await supabase
    .from('product_batches')
    .insert({
      product_id: input.product_id,
      batch_number: input.batch_number ?? null,
      expire_date: input.expire_date ?? null,
      quantity: input.quantity,
      warehouse_id: input.warehouse_id,
      shelf_id: input.shelf_id ?? null,
      buy_price: input.buy_price ?? null,
      supplier_id: input.supplier_id ?? null,
    })
    .select()
    .single();
  if (batchErr) throw AppError.badRequest(batchErr.message);

  if (input.shelf_id) {
    const { data: shelf } = await supabase
      .from('warehouse_shelves')
      .select('current_fill')
      .eq('id', input.shelf_id)
      .single();
    if (shelf) {
      await supabase
        .from('warehouse_shelves')
        .update({ current_fill: shelf.current_fill + input.quantity })
        .eq('id', input.shelf_id);
    }
  }

  const { data: movement, error: moveErr } = await supabase
    .from('stock_movements')
    .insert({
      company_id: input.company_id,
      product_id: input.product_id,
      batch_id: batch.id,
      type: 'in',
      quantity: input.quantity,
      to_warehouse_id: input.warehouse_id,
      reference_doc: input.reference_doc ?? null,
      operator_name: input.operator_name ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (moveErr) throw AppError.badRequest(moveErr.message);

  return { batch, movement };
}

export interface StockTransferInput {
  company_id: string;
  product_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity: number;
  operator_name?: string;
  note?: string;
  reference_doc?: string;
}

// FIFO-deducts from the source warehouse and creates a new batch at the destination.
export async function stockTransfer(input: StockTransferInput) {
  if (input.from_warehouse_id === input.to_warehouse_id) {
    throw AppError.badRequest('from_warehouse_id and to_warehouse_id must differ');
  }

  const result = await deductStockFifo({
    companyId: input.company_id,
    productId: input.product_id,
    quantity: input.quantity,
    warehouseId: input.from_warehouse_id,
    movementType: 'transfer',
    fromWarehouseId: input.from_warehouse_id,
    toWarehouseId: input.to_warehouse_id,
    referenceDoc: input.reference_doc,
    operatorName: input.operator_name,
    note: input.note,
  });

  const { data: newBatch, error: batchErr } = await supabase
    .from('product_batches')
    .insert({
      product_id: input.product_id,
      quantity: input.quantity,
      warehouse_id: input.to_warehouse_id,
    })
    .select()
    .single();
  if (batchErr) throw AppError.badRequest(batchErr.message);

  await checkLowStockAndNotify(input.company_id, input.product_id);

  return { deduction: result, destinationBatch: newBatch };
}

export interface StockAdjustInput {
  company_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number; // signed delta: positive = add, negative = remove
  operator_name?: string;
  note?: string;
  reference_doc?: string;
}

export async function stockAdjust(input: StockAdjustInput) {
  if (input.quantity === 0) throw AppError.badRequest('quantity delta must be non-zero');

  if (input.quantity > 0) {
    const { data: batch, error } = await supabase
      .from('product_batches')
      .insert({
        product_id: input.product_id,
        quantity: input.quantity,
        warehouse_id: input.warehouse_id,
      })
      .select()
      .single();
    if (error) throw AppError.badRequest(error.message);

    const { error: moveErr } = await supabase.from('stock_movements').insert({
      company_id: input.company_id,
      product_id: input.product_id,
      batch_id: batch.id,
      type: 'adjustment',
      quantity: input.quantity,
      to_warehouse_id: input.warehouse_id,
      reference_doc: input.reference_doc ?? null,
      operator_name: input.operator_name ?? null,
      note: input.note ?? null,
    });
    if (moveErr) throw AppError.badRequest(moveErr.message);

    return { batch };
  }

  const result = await deductStockFifo({
    companyId: input.company_id,
    productId: input.product_id,
    quantity: Math.abs(input.quantity),
    warehouseId: input.warehouse_id,
    movementType: 'adjustment',
    referenceDoc: input.reference_doc,
    operatorName: input.operator_name,
    note: input.note,
  });

  return result;
}

// ---------- Public (read-only) ----------

export async function getStockForProductPublic(productId: string) {
  const { data: product, error: productErr } = await supabase
    .from('products')
    .select('id, name, sku')
    .eq('id', productId)
    .single();
  if (productErr || !product) throw AppError.notFound('Product not found');

  const { data: batches, error: batchErr } = await supabase
    .from('product_batches')
    .select('quantity, warehouse_id, warehouses(name)')
    .eq('product_id', productId);
  if (batchErr) throw AppError.internal(batchErr.message);

  const breakdown = new Map<string, { warehouse_id: string; warehouse_name: string; quantity: number }>();
  for (const b of batches ?? []) {
    const key = b.warehouse_id ?? 'unassigned';
    const warehouseName = (b as any).warehouses?.name ?? 'Unassigned';
    const existing = breakdown.get(key);
    if (existing) {
      existing.quantity += b.quantity;
    } else {
      breakdown.set(key, { warehouse_id: key, warehouse_name: warehouseName, quantity: b.quantity });
    }
  }

  const perWarehouse = Array.from(breakdown.values());
  const totalQuantity = perWarehouse.reduce((sum, w) => sum + w.quantity, 0);

  return {
    product_id: product.id,
    product_name: product.name,
    sku: product.sku,
    total_quantity: totalQuantity,
    per_warehouse: perWarehouse,
  };
}