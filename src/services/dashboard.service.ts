import { supabase } from "../lib/supabaseClient.js";
import { AppError } from "../utils/appError.js";

export async function getDashboardKpis(companyId?: string) {
  let orders = supabase.from("orders").select("total");
  let debts = supabase.from("customer_debts").select("remaining_amount");
  let batches = supabase.from("product_batches").select("quantity,buy_price");

  if (companyId) {
    orders = orders.eq("company_id", companyId);
    debts = debts.eq("company_id", companyId);
    batches = batches.in(
      "product_id",
      (
        await supabase
          .from("products")
          .select("id")
          .eq("company_id", companyId)
      ).data?.map((x) => x.id) ?? []
    );
  }

  const [
    { data: ordersData, error: ordersErr },
    { data: debtsData, error: debtsErr },
    { data: batchesData, error: batchesErr },
  ] = await Promise.all([orders, debts, batches]);

  if (ordersErr) throw AppError.internal(ordersErr.message);
  if (debtsErr) throw AppError.internal(debtsErr.message);
  if (batchesErr) throw AppError.internal(batchesErr.message);

  const monthlyRevenue =
    ordersData?.reduce((s, o) => s + Number(o.total ?? 0), 0) ?? 0;

  const stockValue =
    batchesData?.reduce(
      (s, b) => s + Number(b.quantity ?? 0) * Number(b.buy_price ?? 0),
      0
    ) ?? 0;

  const receivables =
    debtsData?.reduce((s, d) => s + Number(d.remaining_amount ?? 0), 0) ?? 0;

  return {
    dailySales: {
      value: monthlyRevenue,
      trend: [{ value: monthlyRevenue }],
    },
    monthlyRevenue: {
      value: monthlyRevenue,
      trend: [{ value: monthlyRevenue }],
    },
    stockValue: {
      value: stockValue,
      trend: [{ value: stockValue }],
    },
    totalReceivables: {
      value: receivables,
      trend: [{ value: receivables }],
    },
  };
}

export async function getSalesChart(companyId?: string) {
  let q = supabase
    .from("orders")
    .select("created_at,total")
    .order("created_at", { ascending: true });

  if (companyId) q = q.eq("company_id", companyId);

  const { data, error } = await q;

  if (error) throw AppError.internal(error.message);

  return (data ?? []).map((x) => ({
    date: x.created_at,
    value: Number(x.total),
  }));
}

export async function getCashFlow(companyId?: string) {
  let q = supabase
    .from("orders")
    .select("created_at,total")
    .order("created_at");

  if (companyId) q = q.eq("company_id", companyId);

  const { data, error } = await q;

  if (error) throw AppError.internal(error.message);

  return (data ?? []).map((x) => ({
    date: x.created_at,
    income: Number(x.total),
    expense: 0,
  }));
}

export async function getBestSellers(companyId?: string) {
  let q = supabase.from("order_items").select(`
    product_id,
    quantity,
    line_total,
    products(name,company_id)
  `);

  const { data, error } = await q;

  if (error) throw AppError.internal(error.message);

  const map = new Map();

  for (const item of data ?? []) {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;

    if (companyId && product?.company_id !== companyId) continue;

    if (!map.has(item.product_id)) {
      map.set(item.product_id, {
        id: item.product_id,
        name: product?.name ?? "",
        unitsSold: 0,
        revenue: 0,
      });
    }

    const row = map.get(item.product_id);

    row.unitsSold += Number(item.quantity);
    row.revenue += Number(item.line_total);
  }

  return [...map.values()]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 6);
}

export async function getLowStock(companyId?: string) {
  let products = supabase
    .from("products")
    .select("id,name,min_stock_threshold,company_id");

  const { data: pData, error: pErr } = await products;

  if (pErr) throw AppError.internal(pErr.message);

  const result = [];

  for (const p of pData ?? []) {
    if (companyId && p.company_id !== companyId) continue;

    const { data: batches } = await supabase
      .from("product_batches")
      .select("quantity")
      .eq("product_id", p.id);

    const qty =
      batches?.reduce((s, b) => s + Number(b.quantity), 0) ?? 0;

    if (qty <= (p.min_stock_threshold ?? 0)) {
      result.push({
        id: p.id,
        productId: p.id,
        name: p.name,
        quantity: qty,
        minThreshold: p.min_stock_threshold,
      });
    }
  }

  return result.slice(0, 6);
}

export async function getOverduePayments(companyId?: string) {
  let q = supabase.from("customer_debts").select(`
    *,
    customers(name)
  `);

  if (companyId) q = q.eq("company_id", companyId);

  const { data, error } = await q;

  if (error) throw AppError.internal(error.message);

  return (data ?? [])
    .filter((d) => Number(d.remaining_amount) > 0)
    .slice(0, 6)
    .map((d) => ({
      id: d.id,
      customerId: d.customer_id,
      customerName: Array.isArray(d.customers)
        ? d.customers[0]?.name
        : d.customers?.name,
      amount: d.remaining_amount,
      daysOverdue: Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(d.due_date).getTime()) /
            86400000
        )
      ),
    }));
}

export async function getRecentTransactions(companyId?: string) {
  let q = supabase
    .from("orders")
    .select("id,order_number,total,created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (companyId) q = q.eq("company_id", companyId);

  const { data, error } = await q;

  if (error) throw AppError.internal(error.message);

  return (data ?? []).map((o) => ({
    id: o.id,
    type: "sale",
    reference: o.order_number,
    amount: o.total,
    createdAt: o.created_at,
  }));
}