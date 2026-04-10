-- ═══════════════════════════════════════════════════════════════════════════
-- Æquo — Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── PLANS ──────────────────────────────────────────────────────────────────

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  price_monthly numeric(10,2) not null default 0,
  price_annual numeric(10,2) not null default 0,
  max_valuations int not null default -1,
  max_properties int not null default -1,
  features jsonb not null default '[]'::jsonb,
  stripe_price_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── USERS ─────────────────────────────────────────────────────────────────

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  company text,
  role text not null default 'USER' check (role in ('ADMIN','MANAGER','USER')),
  plan_id uuid references public.plans(id) on delete set null,
  valuation_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── API KEYS ──────────────────────────────────────────────────────────────

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  key text not null unique,
  name text not null,
  is_active boolean not null default true,
  last_used timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- ─── PROPERTIES ────────────────────────────────────────────────────────────

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  address text not null,
  country text not null default 'DO',
  city text not null,
  state text not null,
  zip_code text not null,
  property_type text not null check (property_type in ('OFICINA','RETAIL','INDUSTRIAL','BODEGA','TERRENO','MIXTO','HOTEL','RESTAURANTE')),
  total_area numeric(12,2) not null,
  constructed_area numeric(12,2),
  lot_area numeric(12,2),
  floors int not null default 1,
  year_built int,
  parking_spaces int not null default 0,
  bathrooms int not null default 1,
  current_use text,
  building_condition text not null default 'BUENO' check (building_condition in ('EXCELENTE','BUENO','REGULAR','MALO','EN_REMODELACION')),
  features jsonb not null default '[]'::jsonb,
  coordinates text,
  image_url text,
  image_urls jsonb,
  notes text,
  status text not null default 'BORRADOR' check (status in ('BORRADOR','VALUADO','EN_REVISION')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── VALUATIONS ────────────────────────────────────────────────────────────

create table if not exists public.valuations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  market_value numeric(14,2) not null,
  price_per_sqm numeric(10,2),
  rental_value numeric(12,2),
  cap_rate numeric(5,2),
  confidence numeric(3,2) not null default 0.80,
  valuation_method text not null check (valuation_method in ('COMPARABLE','INGRESO','COSTO','HIBRIDO')),
  comparables_data jsonb,
  ai_analysis text,
  ai_recommendations text,
  risk_factors jsonb,
  market_trends jsonb,
  valuated_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── IMPORT JOBS ───────────────────────────────────────────────────────────

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  filename text not null,
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','COMPLETED','FAILED')),
  total_rows int not null default 0,
  processed int not null default 0,
  errors jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ─── INDEXES ───────────────────────────────────────────────────────────────

create index if not exists idx_properties_user_id on public.properties(user_id);
create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_city on public.properties(city);
create index if not exists idx_properties_created_at on public.properties(created_at desc);
create index if not exists idx_valuations_property_id on public.valuations(property_id);
create index if not exists idx_valuations_created_at on public.valuations(created_at desc);
create index if not exists idx_api_keys_user_id on public.api_keys(user_id);
create index if not exists idx_api_keys_key on public.api_keys(key);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.plans
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.users
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.properties
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.valuations
  for each row execute function public.handle_updated_at();

-- ─── ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────
-- Enable RLS on all tables
alter table public.plans enable row level security;
alter table public.users enable row level security;
alter table public.api_keys enable row level security;
alter table public.properties enable row level security;
alter table public.valuations enable row level security;
alter table public.import_jobs enable row level security;

-- Allow anonymous reads for demo / public data
create policy "Plans are publicly readable" on public.plans
  for select using (true);

create policy "Properties are publicly readable" on public.properties
  for select using (true);

create policy "Valuations are publicly readable" on public.valuations
  for select using (true);

-- Allow authenticated users full access
create policy "Users can manage their own data" on public.users
  for all using (true);

create policy "Properties can be managed by anyone" on public.properties
  for all using (true);

create policy "Valuations can be managed by anyone" on public.valuations
  for all using (true);

create policy "ApiKeys can be managed by anyone" on public.api_keys
  for all using (true);

create policy "ImportJobs can be managed by anyone" on public.import_jobs
  for all using (true);
