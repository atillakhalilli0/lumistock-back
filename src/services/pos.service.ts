import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { deductStockFifo } from '../utils/costing.js';

export interface CheckoutItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface CheckoutInput {
  company_id: string;
  customer_id?: string;
  warehouse_id?: string; // preferred warehouse for FIFO deduction; falls back to any warehouse
  payment_method: string; // cash | card | transfer | credit | ...
  items: CheckoutItemInput[];
  discount?: number; // order-level discount
  created_by?: string;
  cargo_ref?: string;
}

function generateOrderNumber() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `POS-${stamp}-${rand}`;
}

/**
 * The core transactional POS checkout endpoint:
 * 1. Creates an `orders` row + `order_items` rows
 * 2. FIFO-deducts stock for every line item (writes stock_movements, updates batches/shelves,
 *    and fires low-stock notifications as needed)
 * 3. If payment_method === 'credit', creates a `customer_debts` row (due_date = order date + 30 days)
 * 4. Returns invoice-shaped data: the order, its items, and the stock deductions made
 */
// NOTE: supabase-js issues separate REST calls per statement, so this isn't wrapped in a
// single DB transaction. For stronger atomicity later, consider moving this into a
// Postgres function called via supabase.rpc(). Left as-is for v1 per the stated stack.
export async function checkout(input: CheckoutInput) {
  if (input.items.length === 0) {
    throw AppError.badRequest('At least one line item is required');
  }
  if (input.payment_method === 'credit' && !input.customer_id) {
    throw AppError.badRequest('customer_id is required for credit sales');
  }

  const subtotal = input.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const orderDiscount = input.discount ?? 0;
  const itemDiscounts = input.items.reduce((sum, i) => sum + (i.discount ?? 0), 0);
  const total = subtotal - orderDiscount - itemDiscounts;

  if (total < 0) {
    throw AppError.badRequest('Total cannot be negative — check discounts');
  }

  const orderNumber = generateOrderNumber();

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      company_id: input.company_id,
      order_number: orderNumber,
      customer_id: input.customer_id ?? null,
      status: 'completed',
      payment_method: input.payment_method,
      payment_status: input.payment_method === 'credit' ? 'unpaid' : 'paid',
      subtotal,
      discount: orderDiscount + itemDiscounts,
      total,
      cargo_ref: input.cargo_ref ?? null,
      created_by: input.created_by ?? null,
    })
    .select()
    .single();
  if (orderErr) throw AppError.badRequest(orderErr.message);

  const orderItemsPayload = input.items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    discount: i.discount ?? 0,
  }));

  const { data: orderItems, error: itemsErr } = await supabase
    .from('order_items')
    .insert(orderItemsPayload)
    .select();
  if (itemsErr) throw AppError.badRequest(itemsErr.message);

  // FIFO stock deduction per line item
  const deductions = [];
  for (const item of input.items) {
    const result = await deductStockFifo({
      companyId: input.company_id,
      productId: item.product_id,
      quantity: item.quantity,
      warehouseId: input.warehouse_id,
      movementType: 'out',
      referenceDoc: orderNumber,
      operatorName: input.created_by,
      note: 'POS checkout',
    });
    deductions.push({ product_id: item.product_id, ...result });
  }

  // Credit sale -> create customer_debts row
  let debt = null;
  if (input.payment_method === 'credit') {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const { data: createdDebt, error: debtErr } = await supabase
      .from('customer_debts')
      .insert({
        company_id: input.company_id,
        customer_id: input.customer_id,
        order_id: order.id,
        invoice_number: orderNumber,
        total_amount: total,
        paid_amount: 0,
        due_date: dueDate.toISOString().slice(0, 10),
        status: 'unpaid',
      })
      .select()
      .single();
    if (debtErr) throw AppError.badRequest(debtErr.message);
    debt = createdDebt;
  }

  return {
    order,
    order_items: orderItems,
    stock_deductions: deductions,
    customer_debt: debt,
    invoice: {
      order_number: orderNumber,
      subtotal,
      discount: orderDiscount + itemDiscounts,
      total,
      payment_method: input.payment_method,
      payment_status: order.payment_status,
    },
  };
}