-- Firms master table and reference from challans

create table if not exists firms (
  id bigserial primary key,
  name text not null,
  address text,
  gstin text,
  mobile text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_reason text
);

alter table challans add column if not exists firm_id bigint references firms(id);







