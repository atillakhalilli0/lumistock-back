create extension if not exists "uuid-ossp";

create table subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price_monthly numeric(10,2) not null,
  max_users int, max_products int, max_warehouses int,
  features jsonb default '{}',
  created_at timestamptz default now()
);

create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  tax_id text,
  address text, phone text, email text,
  tax_regime text,
  plan_id uuid references subscription_plans(id),
  status text default 'active',
  country text default 'AZ',
  created_at timestamptz default now()
);

create table warehouses (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null, location text,
  status text default 'active',
  created_at timestamptz default now()
);

create table warehouse_zones (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid references warehouses(id) on delete cascade,
  code text not null, name text
);

create table warehouse_shelves (
  id uuid primary key default uuid_generate_v4(),
  zone_id uuid references warehouse_zones(id) on delete cascade,
  code text not null,
  capacity int default 100,
  current_fill int default 0
);

create table categories (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null, parent_id uuid references categories(id)
);

create table brands (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null, sku text not null, barcode text,
  category_id uuid references categories(id),
  brand_id uuid references brands(id),
  description text,
  buy_price numeric(10,2) default 0,
  sell_price numeric(10,2) default 0,
  corporate_price numeric(10,2),
  unit text default 'pcs',
  min_stock_threshold int default 10,
  image_url text,
  status text default 'active',
  created_at timestamptz default now(),
  unique(company_id, sku)
);

create table product_batches (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  batch_number text,
  expire_date date,
  quantity int not null default 0,
  warehouse_id uuid references warehouses(id),
  shelf_id uuid references warehouse_shelves(id),
  buy_price numeric(10,2),
  supplier_id uuid,
  received_at timestamptz default now()
);

create table stock_movements (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  product_id uuid references products(id),
  batch_id uuid references product_batches(id),
  type text not null,                     -- in | out | transfer | adjustment | damaged | return
  quantity int not null,
  from_warehouse_id uuid references warehouses(id),
  to_warehouse_id uuid references warehouses(id),
  reference_doc text,
  operator_name text,
  note text,
  created_at timestamptz default now()
);

create table customers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  type text default 'retail',             -- corporate | salon | distributor | retail
  tax_id text, contact_name text, phone text, email text, address text,
  credit_limit numeric(10,2) default 0,
  price_tier text default 'standard',
  status text default 'active',
  created_at timestamptz default now()
);

create table customer_product_prices (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  custom_price numeric(10,2),
  discount_pct numeric(5,2),
  unique(customer_id, product_id)
);

create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null, contact_name text, email text, phone text,
  status text default 'active'
);

create table purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  supplier_id uuid references suppliers(id),
  warehouse_id uuid references warehouses(id),
  order_date date default current_date,
  expected_date date,
  status text default 'pending',
  total_amount numeric(10,2) default 0,
  created_at timestamptz default now()
);

create table purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  purchase_order_id uuid references purchase_orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null, unit_price numeric(10,2) not null,
  line_total numeric(10,2) generated always as (quantity * unit_price) stored
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  order_number text not null,
  customer_id uuid references customers(id),
  status text default 'pending',          -- pending | processing | shipped | completed | cancelled
  payment_method text,
  payment_status text default 'unpaid',
  subtotal numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  total numeric(10,2) default 0,
  cargo_ref text,
  created_by text,
  created_at timestamptz default now(),
  unique(company_id, order_number)
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null, unit_price numeric(10,2) not null, discount numeric(10,2) default 0,
  line_total numeric(10,2) generated always as (quantity * unit_price - discount) stored
);

create table customer_debts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id),
  order_id uuid references orders(id),
  invoice_number text,
  total_amount numeric(10,2) not null,
  paid_amount numeric(10,2) default 0,
  remaining_amount numeric(10,2) generated always as (total_amount - paid_amount) stored,
  due_date date,
  status text default 'unpaid',
  created_at timestamptz default now()
);

create table customer_payments (
  id uuid primary key default uuid_generate_v4(),
  debt_id uuid references customer_debts(id) on delete cascade,
  amount numeric(10,2) not null, method text, paid_at timestamptz default now(), reference text, note text
);

create table supplier_debts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  supplier_id uuid references suppliers(id),
  purchase_order_id uuid references purchase_orders(id),
  total_amount numeric(10,2) not null,
  paid_amount numeric(10,2) default 0,
  remaining_amount numeric(10,2) generated always as (total_amount - paid_amount) stored,
  due_date date, status text default 'unpaid'
);

create table supplier_payments (
  id uuid primary key default uuid_generate_v4(),
  supplier_debt_id uuid references supplier_debts(id) on delete cascade,
  amount numeric(10,2) not null, method text, paid_at timestamptz default now(), reference text
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  type text not null, title text not null, description text,
  severity text default 'info',
  is_read boolean default false,
  created_at timestamptz default now()
);

create table notification_rules (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  rule_type text not null,                -- low_stock | payment_overdue | expiry_warning | daily_report
  threshold numeric,
  enabled boolean default true
);

create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null, target_segment text,
  discount_type text, discount_value numeric(10,2),
  start_date date, end_date date,
  status text default 'planned',
  reach_count int default 0
);

create table follow_ups (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  customer_id uuid references customers(id),
  task text not null, due_date date, priority text default 'medium',
  status text default 'open', assigned_to text
);

create table loyalty_points (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  points_balance int default 0, updated_at timestamptz default now()
);

create table users (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  first_name text, last_name text, email text, role text default 'staff',
  avatar_url text, last_login_at timestamptz, device_info text, ip_address text,
  status text default 'active'
);

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  user_name text, action text, module text, detail text,
  old_value jsonb, new_value jsonb, ip_address text,
  created_at timestamptz default now()
);