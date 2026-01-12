-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Customers Table
create table customers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text,
  zone text, -- Norte, Sur, etc.
  category text default 'Nuevo', -- Nuevo, Frecuente, VIP
  favorite_product text,
  total_orders integer default 0,
  total_purchased numeric(10,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products Table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sale_price numeric not null,
  production_cost numeric not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions (Movements) Table
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  type text check (type in ('VENTA', 'GASTO')) not null,
  amount numeric not null,
  description text,
  client_id uuid references customers(id),
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Configuration Table
create table configuration (
  id uuid default uuid_generate_v4() primary key,
  monthly_fixed_costs numeric default 0,
  monthly_goal numeric default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders Table (Kitchen Deck)
create table orders (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references customers(id),
  items jsonb not null default '[]'::jsonb,
  delivery_date timestamp with time zone not null,
  status text check (status in ('PENDIENTE', 'ENTREGADO', 'CANCELADO')) default 'PENDIENTE',
  total_amount numeric not null default 0,
  prepayment numeric default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Supplies (Raw Materials)
create table supplies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  current_cost numeric(10,2) not null,
  unit text default 'kg', -- kg, lt, pza
  current_stock numeric(10,3) default 0,
  min_alert numeric(10,3) default 0,
  history jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products (Catalog)
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric(10,2) not null,
  calculated_cost numeric(10,2), -- Updated via trigger or API
  category text, 
  image_url text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Recipes (Engineering)
create table recipes (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id),
  supply_id uuid references supplies(id),
  quantity numeric(10,4) not null, -- Precision for small amounts
  unit text, -- Should match supply unit
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Packaging Inventory Table
create table packaging_inventory (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- e.g., 'Caja Rosca Grande', 'Bolsa Papel'
  cost numeric(10,2) default 0, -- Costo unitario
  current_quantity integer default 0,
  min_alert integer default 10,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed Data (Optional)
insert into configuration (monthly_fixed_costs, monthly_goal) values (15000, 50000);
