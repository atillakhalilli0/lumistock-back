import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

export interface PurchaseOrderItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface PurchaseOrderInput {
  company_id: string;
  supplier_id: string;
  warehouse_id: string;
  order_date?: string;
  expected_date?: string;
  status?: string;
  items: PurchaseOrderItemInput[];
}

export async function listPurchaseOrders(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('purchase_orders').select('*', { count: 'exact' });
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.status) q = q.eq('status', String(query.status));
  if (query.supplier_id) q = q.eq('supplier_id', String(query.supplier_id));
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function getPurchaseOrderById(id: string) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*)')
    .eq('id', id)
    .single();
  if (error || !data) throw AppError.notFound('Purchase order not found');
  return data;
}

export async function createPurchaseOrder(input: PurchaseOrderInput) {
  const total = input.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const { data: po, error: poErr } = await supabase
    .from('purchase_orders')
    .insert({
      company_id: input.company_id,
      supplier_id: input.supplier_id,
      warehouse_id: input.warehouse_id,
      order_date: input.order_date,
      expected_date: input.expected_date,
      status: input.status ?? 'pending',
      total_amount: total,
    })
    .select()
    .single();
  if (poErr) throw AppError.badRequest(poErr.message);

  const itemsPayload = input.items.map((i) => ({
    purchase_order_id: po.id,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));

  const { data: items, error: itemsErr } = await supabase
    .from('purchase_order_items')
    .insert(itemsPayload)
    .select();
  if (itemsErr) throw AppError.badRequest(itemsErr.message);

  return { ...po, purchase_order_items: items };
}

export async function updatePurchaseOrder(id: string, input: Record<string, unknown>) {
  await getPurchaseOrderById(id);
  const { data, error } = await supabase.from('purchase_orders').update(input).eq('id', id).select().single();
  if (error) throw AppError.badRequest(error.message);
  return data;
}

export async function deletePurchaseOrder(id: string) {
  await getPurchaseOrderById(id);
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
  if (error) throw AppError.badRequest(error.message);
}

/**
 * Marks a purchase order as received: creates product_batches for each line
 * item, logs 'in' stock_movements, and creates a supplier_debts row for the
 * total (net-30 due date), then flips the PO status to 'received'.
 */
export async function receivePurchaseOrder(id: string, dueInDays = 30) {
  const po = await getPurchaseOrderById(id);
  if (po.status === 'received') {
    throw AppError.conflict('Purchase order has already been received');
  }

  const items: any[] = (po as any).purchase_order_items ?? [];
  if (items.length === 0) {
    throw AppError.badRequest('Purchase order has no line items to receive');
  }

  const createdBatches = [];
  const createdMovements = [];

  for (const item of items) {
    const { data: batch, error: batchErr } = await supabase
      .from('product_batches')
      .insert({
        product_id: item.product_id,
        quantity: item.quantity,
        warehouse_id: po.warehouse_id,
        buy_price: item.unit_price,
        supplier_id: po.supplier_id,
      })
      .select()
      .single();
    if (batchErr) throw AppError.badRequest(batchErr.message);
    createdBatches.push(batch);

    const { data: movement, error: moveErr } = await supabase
      .from('stock_movements')
      .insert({
        company_id: po.company_id,
        product_id: item.product_id,
        batch_id: batch.id,
        type: 'in',
        quantity: item.quantity,
        to_warehouse_id: po.warehouse_id,
        reference_doc: `PO-${po.id}`,
        note: 'Received from purchase order',
      })
      .select()
      .single();
    if (moveErr) throw AppError.badRequest(moveErr.message);
    createdMovements.push(movement);
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueInDays);

  const { data: debt, error: debtErr } = await supabase
    .from('supplier_debts')
    .insert({
      company_id: po.company_id,
      supplier_id: po.supplier_id,
      purchase_order_id: po.id,
      total_amount: po.total_amount,
      due_date: dueDate.toISOString().slice(0, 10),
      status: 'unpaid',
    })
    .select()
    .single();
  if (debtErr) throw AppError.badRequest(debtErr.message);

  const { data: updatedPo, error: updateErr } = await supabase
    .from('purchase_orders')
    .update({ status: 'received' })
    .eq('id', id)
    .select()
    .single();
  if (updateErr) throw AppError.badRequest(updateErr.message);

  return { purchaseOrder: updatedPo, batches: createdBatches, movements: createdMovements, supplierDebt: debt };
}