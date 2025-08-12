-- Enable required extensions if any (none strictly required)

-- Master tables
create table if not exists customers (
  id bigserial primary key,
  name text not null,
  address text,
  gstin text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_reason text
);

create table if not exists shifts (
  id bigserial primary key,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_reason text
);

create table if not exists metallics (
  id bigserial primary key,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_reason text
);

create table if not exists cuts (
  id bigserial primary key,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_reason text
);

create table if not exists employees (
  id bigserial primary key,
  name text not null,
  role_operator boolean not null default false,
  role_helper boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_reason text
);

create table if not exists bob_types (
  id bigserial primary key,
  name text not null unique,
  weight_kg numeric(12,3) not null check (weight_kg >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_reason text
);

create table if not exists box_types (
  id bigserial primary key,
  name text not null unique,
  weight_kg numeric(12,3) not null check (weight_kg >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_reason text
);

-- Sequencing
create table if not exists sequencing (
  key text primary key,
  value bigint not null default 0
);

insert into sequencing (key, value) values ('challan_no', 0)
  on conflict (key) do nothing;

-- Challans
create table if not exists challans (
  id bigserial primary key,
  challan_no bigint not null unique,
  date date not null,
  customer_id bigint not null references customers(id),
  shift_id bigint not null references shifts(id),
  pdf_path text,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  delete_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_challans_date on challans(date);

-- Items
create table if not exists challan_items (
  id bigserial primary key,
  challan_id bigint not null references challans(id) on delete cascade,
  item_index int not null,
  metallic_id bigint not null references metallics(id),
  cut_id bigint not null references cuts(id),
  operator_id bigint not null references employees(id),
  helper_id bigint references employees(id),
  bob_type_id bigint not null references bob_types(id),
  box_type_id bigint not null references box_types(id),
  bob_qty int not null check (bob_qty >= 0),
  gross_wt numeric(12,3) not null check (gross_wt >= 0),
  tare_wt numeric(12,3) not null check (tare_wt >= 0),
  net_wt numeric(12,3) not null,
  barcode text not null unique,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  delete_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_challan_items_challan on challan_items(challan_id);
create index if not exists idx_challan_items_barcode on challan_items(barcode);
