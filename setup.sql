-- ============================================================
--  CommunityPro — Supabase Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ========================
-- PROFILES (all app users)
-- ========================
create table if not exists public.profiles (
  id            uuid         default gen_random_uuid() primary key,
  name          text         not null,
  email         text         not null,
  password_hash text         not null,
  role          text         not null default 'user'
                             check (role in ('superadmin', 'siteadmin', 'user')),
  site_id       uuid,
  phone         text,
  created_at    timestamptz  default now(),
  constraint profiles_email_unique unique (email)
);

-- ========================
-- SITES
-- ========================
create table if not exists public.sites (
  id            uuid         default gen_random_uuid() primary key,
  name          text         not null,
  range         text,
  area          text,
  city          text,
  district      text,
  pin_code      text,
  state         text,
  country       text,
  description   text,
  admin_id      uuid         references public.profiles(id) on delete set null,
  created_at    timestamptz  default now()
);

-- If upgrading an existing database, run these to add new columns:
alter table public.sites add column if not exists range    text;
alter table public.sites add column if not exists area     text;
alter table public.sites add column if not exists city     text;
alter table public.sites add column if not exists district text;
alter table public.sites add column if not exists pin_code text;
alter table public.sites add column if not exists state    text;
alter table public.sites add column if not exists country  text;

-- New role permission columns (run when upgrading from earlier schema)
alter table public.roles add column if not exists site_admin_access  boolean default false;
alter table public.roles add column if not exists create_members     boolean default false;
alter table public.roles add column if not exists create_dependents  boolean default false;
alter table public.roles add column if not exists create_users       boolean default false;
alter table public.members add column if not exists photo_url        text;
alter table public.members add column if not exists dashboard_view_order integer;

-- Circular FK: profiles.site_id → sites.id (added after sites table exists)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'profiles_site_id_fkey'
      and table_name = 'profiles'
  ) then
    alter table public.profiles
      add constraint profiles_site_id_fkey
      foreign key (site_id) references public.sites(id) on delete set null;
  end if;
end $$;

-- ========================
-- ACTIVITIES
-- ========================
create table if not exists public.activities (
  id             uuid         default gen_random_uuid() primary key,
  name           text         not null,
  type           text         not null check (type in ('fee', 'data')),
  site_id        uuid         references public.sites(id) on delete cascade,
  target_amount  numeric(12,2),
  due_date       date,
  description    text,
  assigned_users uuid[]       default '{}',
  created_at     timestamptz  default now()
);

-- ========================
-- FEE RECORDS
-- ========================
create table if not exists public.fee_records (
  id            uuid          default gen_random_uuid() primary key,
  activity_id   uuid          references public.activities(id) on delete cascade,
  site_id       uuid          references public.sites(id) on delete cascade,
  collected_by  uuid          references public.profiles(id) on delete set null,
  payer_name    text          not null,
  payer_phone   text,
  amount        numeric(12,2) not null,
  date          date          not null,
  notes         text,
  created_at    timestamptz   default now()
);

-- ========================
-- DATA RECORDS
-- ========================
create table if not exists public.data_records (
  id            uuid         default gen_random_uuid() primary key,
  activity_id   uuid         references public.activities(id) on delete cascade,
  site_id       uuid         references public.sites(id) on delete cascade,
  collected_by  uuid         references public.profiles(id) on delete set null,
  person_name   text         not null,
  address       text,
  phone         text,
  email         text,
  date          date         not null,
  notes         text,
  created_at    timestamptz  default now()
);

-- ========================
-- DISABLE RLS
-- App handles all authorization logic.
-- Enable & configure RLS policies before public internet deployment.
-- ========================
alter table public.profiles     disable row level security;
alter table public.sites        disable row level security;
alter table public.activities   disable row level security;
alter table public.fee_records  disable row level security;
alter table public.data_records disable row level security;

-- ========================
-- LOCATION LOOKUP TABLES
-- Power the Country → State → District → City → Pin Code dropdowns in the Sites module.
-- lookup_country / lookup_state / lookup_district already exist — created separately.
-- ========================
create table if not exists public.lookup_country (
  country_id bigint generated by default as identity not null,
  country    text,
  "order"    smallint,
  constraint lookup_country_pkey primary key (country_id)
);

create table if not exists public.lookup_state (
  state_id   bigint generated by default as identity not null,
  state      text,
  country_id bigint references public.lookup_country(country_id),
  "order"    smallint,
  constraint lookup_state_pkey primary key (state_id)
);

create table if not exists public.lookup_district (
  district_id bigint generated by default as identity not null,
  district    text,
  state_id    bigint references public.lookup_state(state_id),
  "order"     smallint,
  constraint lookup_district_pkey primary key (district_id)
);

create table if not exists public.lookup_city (
  city_id     bigint generated by default as identity not null,
  city        text,
  district_id bigint references public.lookup_district(district_id),
  "order"     smallint,
  constraint lookup_city_pkey primary key (city_id)
);

create table if not exists public.lookup_pincode (
  pincode_id  bigint generated by default as identity not null,
  pincode     text,
  city_id     bigint references public.lookup_city(city_id),
  "order"     smallint,
  constraint lookup_pincode_pkey primary key (pincode_id)
);

alter table public.lookup_country  disable row level security;
alter table public.lookup_state    disable row level security;
alter table public.lookup_district disable row level security;
alter table public.lookup_city     disable row level security;
alter table public.lookup_pincode  disable row level security;

-- Done! Open the app — it will prompt you to create the Super Admin on first run.
