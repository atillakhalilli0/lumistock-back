import { supabase } from '../lib/supabaseClient.js';
import { AppError } from './appError.js';

export interface FifoDeductionLine {
  batchId: string;
  quantityDeducted: number;
  buyPrice: number | null;
}

export interface FifoDeductionResult {
  lines: FifoDeductionLine[];
  totalDeducted: number;
}

/**
 * Deducts `quantity` units of `productId` from product_batches, oldest-expiring /
 * earliest-received first (FIFO). Optionally constrained to a single warehouse.
 * Writes one stock_movements row per batch touched.
 *
 * Throws AppError(409) if insufficient stock is available across all batches.
 */
export async function deductStockFifo(params: {
  companyId: string;
  productId: string;
  quantity: number;
  warehouseId?: string;
  movementType?: string; // out | transfer | damaged | adjustment
  referenceDoc?: string;
  operatorName?: string;
  note?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
}): Promise<FifoDeductionResult> {
  const {
    companyId,
    productId,
    quantity,
    warehouseId,
    movementType = 'out',
    referenceDoc,
    operatorName,
    note,
    fromWarehouseId,
    toWarehouseId,
  } = params;

  if (quantity <= 0) {
    throw AppError.badRequest('Quantity must be greater than zero');
  }

  let query = supabase
    .from('product_batches')
    .select('id, quantity, buy_price, expire_date, received_at, warehouse_id, shelf_id')
    .eq('product_id', productId)
    .gt('quantity', 0)
    .order('expire_date', { ascending: true, nullsFirst: false })
    .order('received_at', { ascending: true });

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId);
  }

  const { data: batches, error } = await query;
  if (error) throw AppError.internal(error.message);

  const available = (batches ?? []).reduce((sum, b) => sum + b.quantity, 0);
  if (available < quantity) {
    throw new AppError(
      `Insufficient stock: requested ${quantity}, available ${available}`,
      409,
      'INSUFFICIENT_STOCK'
    );
  }

  let remaining = quantity;
  const lines: FifoDeductionLine[] = [];

  for (const batch of batches ?? []) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    if (take <= 0) continue;

    const newQty = batch.quantity - take;
    const { error: updateErr } = await supabase
      .from('product_batches')
      .update({ quantity: newQty })
      .eq('id', batch.id);
    if (updateErr) throw AppError.internal(updateErr.message);

    // Update shelf fill if the batch is shelved
    if (batch.shelf_id) {
      const { data: shelf } = await supabase
        .from('warehouse_shelves')
        .select('current_fill')
        .eq('id', batch.shelf_id)
        .single();
      if (shelf) {
        await supabase
          .from('warehouse_shelves')
          .update({ current_fill: Math.max(0, shelf.current_fill - take) })
          .eq('id', batch.shelf_id);
      }
    }

    const { error: movementErr } = await supabase.from('stock_movements').insert({
      company_id: companyId,
      product_id: productId,
      batch_id: batch.id,
      type: movementType,
      quantity: take,
      from_warehouse_id: fromWarehouseId ?? batch.warehouse_id,
      to_warehouse_id: toWarehouseId ?? null,
      reference_doc: referenceDoc ?? null,
      operator_name: operatorName ?? null,
      note: note ?? null,
    });
    if (movementErr) throw AppError.internal(movementErr.message);

    lines.push({ batchId: batch.id, quantityDeducted: take, buyPrice: batch.buy_price });
    remaining -= take;
  }

  await checkLowStockAndNotify(companyId, productId);

  return { lines, totalDeducted: quantity };
}

/**
 * Recomputes total remaining quantity for a product and, if it is at/below
 * min_stock_threshold, inserts a low_stock notification — guarding against
 * duplicate unread notifications for the same product.
 */
export async function checkLowStockAndNotify(companyId: string, productId: string): Promise<void> {
  const { data: product, error: productErr } = await supabase
    .from('products')
    .select('id, name, min_stock_threshold')
    .eq('id', productId)
    .single();
  if (productErr || !product) return;

  const { data: batches } = await supabase
    .from('product_batches')
    .select('quantity')
    .eq('product_id', productId);

  const totalQuantity = (batches ?? []).reduce((sum, b) => sum + b.quantity, 0);

  if (totalQuantity > (product.min_stock_threshold ?? 0)) return;

  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'low_stock')
    .eq('is_read', false)
    .ilike('description', `%${productId}%`)
    .limit(1);

  if (existing && existing.length > 0) return; // avoid duplicate unread notification

  await supabase.from('notifications').insert({
    company_id: companyId,
    type: 'low_stock',
    title: `Low stock: ${product.name}`,
    description: `Product ${product.name} (id: ${productId}) has ${totalQuantity} units remaining, at or below threshold ${product.min_stock_threshold}.`,
    severity: 'warning',
  });
}