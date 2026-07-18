import { supabase } from '../lib/supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';

// ---------- Customer debts ----------

export async function listCustomerDebts(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('customer_debts').select('*', { count: 'exact' });
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.customer_id) q = q.eq('customer_id', String(query.customer_id));
  if (query.status) q = q.eq('status', String(query.status));
  const { data, error, count } = await q.order('due_date', { ascending: true }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function getCustomerDebtById(id: string) {
  const { data, error } = await supabase.from('customer_debts').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Customer debt not found');
  return data;
}

// Records a payment against a customer debt, updates paid_amount, and flips
// status to paid/partial based on remaining_amount.
export async function payCustomerDebt(
  debtId: string,
  input: { amount: number; method?: string; reference?: string; note?: string }
) {
  const debt = await getCustomerDebtById(debtId);

  if (input.amount <= 0) throw AppError.badRequest('Payment amount must be greater than zero');

  const { data: payment, error: paymentErr } = await supabase
    .from('customer_payments')
    .insert({
      debt_id: debtId,
      amount: input.amount,
      method: input.method ?? null,
      reference: input.reference ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (paymentErr) throw AppError.badRequest(paymentErr.message);

  const newPaidAmount = Number(debt.paid_amount) + input.amount;
  const remaining = Number(debt.total_amount) - newPaidAmount;
  const newStatus = remaining <= 0 ? 'paid' : 'partial';

  const { data: updatedDebt, error: updateErr } = await supabase
    .from('customer_debts')
    .update({ paid_amount: newPaidAmount, status: newStatus })
    .eq('id', debtId)
    .select()
    .single();
  if (updateErr) throw AppError.badRequest(updateErr.message);

  return { payment, debt: updatedDebt };
}

// ---------- Supplier debts ----------

export async function listSupplierDebts(query: Record<string, unknown>) {
  const pagination = parsePagination(query);
  let q = supabase.from('supplier_debts').select('*', { count: 'exact' });
  if (query.company_id) q = q.eq('company_id', String(query.company_id));
  if (query.supplier_id) q = q.eq('supplier_id', String(query.supplier_id));
  if (query.status) q = q.eq('status', String(query.status));
  const { data, error, count } = await q.order('due_date', { ascending: true }).range(pagination.offset, pagination.limit);
  if (error) throw AppError.internal(error.message);
  return buildPaginatedResponse(data ?? [], count, pagination);
}

export async function getSupplierDebtById(id: string) {
  const { data, error } = await supabase.from('supplier_debts').select('*').eq('id', id).single();
  if (error || !data) throw AppError.notFound('Supplier debt not found');
  return data;
}

export async function paySupplierDebt(
  debtId: string,
  input: { amount: number; method?: string; reference?: string }
) {
  const debt = await getSupplierDebtById(debtId);

  if (input.amount <= 0) throw AppError.badRequest('Payment amount must be greater than zero');

  const { data: payment, error: paymentErr } = await supabase
    .from('supplier_payments')
    .insert({
      supplier_debt_id: debtId,
      amount: input.amount,
      method: input.method ?? null,
      reference: input.reference ?? null,
    })
    .select()
    .single();
  if (paymentErr) throw AppError.badRequest(paymentErr.message);

  const newPaidAmount = Number(debt.paid_amount) + input.amount;
  const remaining = Number(debt.total_amount) - newPaidAmount;
  const newStatus = remaining <= 0 ? 'paid' : 'partial';

  const { data: updatedDebt, error: updateErr } = await supabase
    .from('supplier_debts')
    .update({ paid_amount: newPaidAmount, status: newStatus })
    .eq('id', debtId)
    .select()
    .single();
  if (updateErr) throw AppError.badRequest(updateErr.message);

  return { payment, debt: updatedDebt };
}