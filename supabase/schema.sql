-- Crumbless — database schema for the food-rescue core loop
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
-- It matches the DB interface in lib/data/types.ts.
--
-- Safe to re-run: every object uses "if not exists" / "or replace", policies are
-- dropped before being re-created, and inserts are guarded so they won't duplicate.
--
-- Note: your `licenses` Storage bucket and its policies are already set up, so this
-- file does not touch Storage.

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type pickup_status as enum ('open','claimed','in_transit','delivered','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('business','student','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type profile_status as enum ('pending','approved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type food_category as enum ('Prepared','Produce','Bakery','Dairy','Packaged');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Where deliveries are dropped off (shelters / food banks).
create table if not exists public.dropoff_sites (
  id      uuid primary key default gen_random_uuid(),
  name    text not null,
  city    text not null,
  address text not null,
  active  boolean not null default true
);

-- One row per user, linked to Supabase Auth.
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  role             user_role not null default 'student',
  name             text not null default '',
  email            text not null default '',
  status           profile_status not null default 'pending',
  business_name    text,
  address          text,
  school           text,
  grade            text,
  phone            text,
  guardian_contact text,
  license_url      text,
  insurance_url    text,
  created_at       timestamptz not null default now()
);

-- The core record: a surplus-food pickup posted by a business and delivered by a student.
create table if not exists public.pickups (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.profiles(id) on delete cascade,
  business_name  text not null,
  food           text not null,
  category       food_category not null,
  quantity       text not null,
  pickup_window  text not null,
  pickup_address text not null,
  dropoff_site_id uuid references public.dropoff_sites(id),
  status         pickup_status not null default 'open',
  photo_url      text,
  notes          text,
  hours_credit   numeric not null default 1.5,
  created_at     timestamptz not null default now(),
  student_id     uuid references public.profiles(id),
  student_name   text,
  distance_miles numeric
);

create index if not exists pickups_status_idx   on public.pickups(status);
create index if not exists pickups_business_idx  on public.pickups(business_id);
create index if not exists pickups_student_idx   on public.pickups(student_id);

-- ----------------------------------------------------------------------------
-- Helper: map the app's role string to the user_role enum.
-- The live site uses 'driver' for students; everything unknown becomes 'student'.
-- ----------------------------------------------------------------------------
create or replace function public.role_from_text(r text)
returns user_role language sql immutable as $$
  select case lower(coalesce(r,''))
    when 'business' then 'business'::user_role
    when 'admin'    then 'admin'::user_role
    else 'student'::user_role
  end;
$$;

-- ----------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, name, email, status)
  values (
    new.id,
    public.role_from_text(new.raw_user_meta_data->>'role'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create profile rows for any users who signed up before this ran.
insert into public.profiles (id, role, name, email, status)
select
  u.id,
  public.role_from_text(u.raw_user_meta_data->>'role'),
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  coalesce(u.email, ''),
  'pending'
from auth.users u
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- View: completed deliveries as service-hour entries (drives getStudentHours).
-- ----------------------------------------------------------------------------
create or replace view public.hours_entries as
  select
    p.id                              as id,
    p.id                              as pickup_id,
    p.student_id                      as student_id,
    p.food                            as food,
    p.business_name                   as business_name,
    coalesce(d.name, 'Shelter')       as dropoff_site_name,
    p.created_at                      as delivered_at,
    p.hours_credit                    as hours
  from public.pickups p
  left join public.dropoff_sites d on d.id = p.dropoff_site_id
  where p.status = 'delivered';

-- ----------------------------------------------------------------------------
-- Row Level Security
-- Starting point — review against your real policy needs before going live.
-- ----------------------------------------------------------------------------
alter table public.dropoff_sites enable row level security;
alter table public.profiles      enable row level security;
alter table public.pickups       enable row level security;

-- Drop-off sites: readable by anyone signed in.
drop policy if exists dropoff_read on public.dropoff_sites;
create policy dropoff_read on public.dropoff_sites
  for select using (auth.role() = 'authenticated');

-- Profiles: a user can read and update their own row.
drop policy if exists profile_self_read on public.profiles;
create policy profile_self_read on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profile_self_upsert on public.profiles;
create policy profile_self_upsert on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profile_self_update on public.profiles;
create policy profile_self_update on public.profiles
  for update using (auth.uid() = id);

-- Pickups:
--   * any signed-in user can see open pickups (so students can browse)
--   * a business sees its own pickups; a student sees pickups they claimed
drop policy if exists pickups_read on public.pickups;
create policy pickups_read on public.pickups
  for select using (
    status = 'open'
    or business_id = auth.uid()
    or student_id = auth.uid()
  );

-- A business can create pickups for itself.
drop policy if exists pickups_business_insert on public.pickups;
create policy pickups_business_insert on public.pickups
  for insert with check (business_id = auth.uid());

-- A business can update/cancel its own pickups; a student can update a pickup
-- they have claimed, and any signed-in user can claim an open one.
drop policy if exists pickups_update on public.pickups;
create policy pickups_update on public.pickups
  for update using (
    business_id = auth.uid()
    or student_id = auth.uid()
    or (status = 'open' and auth.role() = 'authenticated')
  );

-- ----------------------------------------------------------------------------
-- Optional seed: a couple of drop-off sites so the loop has somewhere to deliver.
-- Comment out if you don't want sample data.
-- ----------------------------------------------------------------------------
insert into public.dropoff_sites (name, city, address, active)
select * from (values
  ('Maryland Food Bank',      'Baltimore', '2200 Halethorpe Farms Rd', true),
  ('Community Crisis Center', 'Rockville', '600 E Gude Dr',            true)
) as v(name, city, address, active)
where not exists (select 1 from public.dropoff_sites);
