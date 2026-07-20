import { supabase } from "../lib/supabaseClient.js";
import { AppError } from "../utils/appError.js";

// ---- date helpers -----------------------------------------------------

function parseRangeDays(range?: string): number {
  if (!range) return 7;
  const match = /^(\d+)d$/.exec(range);
  if (!match) return 7;
  return Math.max(1, Math.min(90, Number(match[1])));
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayLabel(isoDateStr: string): string {
  const d = new Date(`${isoDateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Ascending list of 'YYYY-MM-DD' strings for the last `days` days, including today. */
function buildDayRange(days: number): string[] {
  const result: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    result.push(isoDay(d));
  }
  return result;
}

function rangeStartDate(days: number): Date {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);
  return since;
}

// ---- KPIs ---------------------------------------------------------------

export async function getDashboardKpis(companyId?: string) {
  let orders = supabase.from("orders").select("total,created_at");
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

  // Build a real multi-point trend for sales from the last 7 days of orders,
  // so the KpiCard sparkline has more than one point to draw.
  const trendDays = buildDayRange(7);
  const byDay = new Map<string, number>();
  for (const o of ordersData ?? []) {
    if (!o.created_at) continue;
    const day = isoDay(new Date(o.created_at));
    byDay.set(day, (byDay.get(day) ?? 0) + Number(o.total ?? 0));
  }
  const salesTrend = trendDays.map((day) => ({
    value: Math.round((byDay.get(day) ?? 0) * 100) / 100,
  }));

  // stockValue and receivables are point-in-time snapshots — there's no
  // history table to derive a real trend from yet, so we surface the
  // current value as a flat two-point line rather than a single point
  // (a single point renders nothing in the sparkline).
  const flatTrend = (value: number) => [{ value }, { value }];

  return {
    dailySales: {
      value: monthlyRevenue,
      trend: salesTrend,
    },
    monthlyRevenue: {
      value: monthlyRevenue,
      trend: salesTrend,
    },
    stockValue: {
      value: stockValue,
      trend: flatTrend(stockValue),
    },
    totalReceivables: {
      value: receivables,
      trend: flatTrend(receivables),
    },
  };
}

// ---- Sales chart ----------------------------------------------------------

export async function getSalesChart(companyId?: string, range?: string) {
  const days = parseRangeDays(range);
  const since = rangeStartDate(days);

  let q = supabase
    .from("orders")
    .select("created_at,total")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (companyId) q = q.eq("company_id", companyId);

  const { data, error } = await q;
  if (error) throw AppError.internal(error.message);

  const byDay = new Map<string, number>();
  for (const row of data ?? []) {
    const day = isoDay(new Date(row.created_at));
    byDay.set(day, (byDay.get(day) ?? 0) + Number(row.total ?? 0));
  }

  return buildDayRange(days).map((day) => ({
    label: dayLabel(day),
    total: Math.round((byDay.get(day) ?? 0) * 100) / 100,
  }));
}

// ---- Cash flow --------------------------------------------------------

export async function getCashFlow(companyId?: string, range?: string) {
  const days = parseRangeDays(range);
  const since = rangeStartDate(days);

  let q = supabase
    .from("orders")
    .select("created_at,total")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (companyId) q = q.eq("company_id", companyId);

  const { data, error } = await q;
  if (error) throw AppError.internal(error.message);

  // Inflow = order totals per day. There's no expense/purchase-cost data
  // wired up on this endpoint yet, so outflow stays 0 (same simplification
  // as before, just aggregated and renamed to match the chart's props).
  const byDay = new Map<string, number>();
  for (const row of data ?? []) {
    const day = isoDay(new Date(row.created_at));
    byDay.set(day, (byDay.get(day) ?? 0) + Number(row.total ?? 0));
  }

  return buildDayRange(days).map((day) => ({
    label: dayLabel(day),
    inflow: Math.round((byDay.get(day) ?? 0) * 100) / 100,
    outflow: 0,
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