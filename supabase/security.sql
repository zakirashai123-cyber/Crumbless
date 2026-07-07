-- Crumbless — SECURITY HARDENING migration.
-- Run this in Supabase → SQL Editor AFTER schema.sql. Safe to re-run.
--
-- Fixes found in the live audit:
--   * hours_entries view leaked all rows (views bypass RLS by default)
--   * clients could self-grant hours (insert/patch pickups to 'delivered')
--   * users could change their own profiles.role / status
-- After this, role, approval, and "verified" hours are decided by the
-- SERVER (SQL functions + RLS), never by the browser.

-- ============================================================================
-- 1) Admin check (reads profiles, not editable metadata)
-- ============================================================================
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to authenticated, anon;

-- ============================================================================
-- 2) Stop the hours_entries view from leaking — make it respect the caller's RLS
-- ============================================================================
alter view public.hours_entries set (security_invoker = on);

-- ============================================================================
-- 3) Lock profiles: a user may edit their own name/school/phone, but NEVER
--    their own role or approval status. Only an admin can change those.
-- ============================================================================
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.role   := old.role;
    new.status := old.status;
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard_trg on public.profiles;
create trigger profiles_guard_trg before update on public.profiles
  for each row execute function public.profiles_guard();

drop policy if exists profile_admin_read on public.profiles;
create policy profile_admin_read on public.profiles
  for select using (public.is_admin());
drop policy if exists profile_admin_update on public.profiles;
create policy profile_admin_update on public.profiles
  for update using (public.is_admin());

-- ============================================================================
-- 4) Shelter verification code — this is what makes a delivery "verified".
-- ============================================================================
alter table public.dropoff_sites add column if not exists code text;
update public.dropoff_sites
  set code = 'CRUMB-' || upper(substr(md5(id::text),1,4))
  where code is null;

-- ============================================================================
-- 5) Lock pickups: clients can only create OPEN pickups and cancel their own.
--    Claim / pickup / deliver happen ONLY through the functions below.
-- ============================================================================
drop policy if exists pickups_business_insert on public.pickups;
create policy pickups_business_insert on public.pickups
  for insert with check (business_id = auth.uid() and status = 'open' and student_id is null);

drop policy if exists pickups_update on public.pickups;
create policy pickups_update on public.pickups
  for update using (business_id = auth.uid() and status = 'open')
  with check (business_id = auth.uid() and status in ('open','cancelled'));

-- who may drive: an approved student driver, or an admin
create or replace function public.can_drive(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.profiles
    where id = uid and (role = 'admin' or (role = 'student' and status = 'approved')));
$$;
grant execute on function public.can_drive(uuid) to authenticated;

create or replace function public.claim_pickup(p_id uuid)
returns public.pickups language plpgsql security definer set search_path = public as $$
declare r public.pickups;
begin
  if not public.can_drive(auth.uid()) then raise exception 'You must be an approved driver to claim routes.'; end if;
  update public.pickups set status='claimed', student_id=auth.uid(),
      student_name=coalesce((select name from public.profiles where id=auth.uid()),'Driver')
   where id=p_id and status='open'
   returning * into r;
  if r.id is null then raise exception 'This route was just claimed by someone else.'; end if;
  return r;
end $$;
grant execute on function public.claim_pickup(uuid) to authenticated;

create or replace function public.pickup_picked_up(p_id uuid)
returns public.pickups language plpgsql security definer set search_path = public as $$
declare r public.pickups;
begin
  update public.pickups set status='in_transit'
   where id=p_id and student_id=auth.uid() and status='claimed'
   returning * into r;
  if r.id is null then raise exception 'Could not update this pickup.'; end if;
  return r;
end $$;
grant execute on function public.pickup_picked_up(uuid) to authenticated;

-- Deliver requires the shelter's code — the server verifies it before crediting hours.
create or replace function public.deliver_pickup(p_id uuid, p_code text)
returns public.pickups language plpgsql security definer set search_path = public as $$
declare r public.pickups; site_code text;
begin
  select d.code into site_code
    from public.pickups pk join public.dropoff_sites d on d.id = pk.dropoff_site_id
   where pk.id = p_id and pk.student_id = auth.uid();
  if site_code is null then raise exception 'Pickup not found or not assigned to you.'; end if;
  if p_code is null or upper(trim(p_code)) <> upper(site_code) then
    raise exception 'That shelter code is not correct.'; end if;
  update public.pickups set status='delivered'
   where id=p_id and student_id=auth.uid() and status in ('claimed','in_transit')
   returning * into r;
  if r.id is null then raise exception 'Could not confirm this delivery.'; end if;
  return r;
end $$;
grant execute on function public.deliver_pickup(uuid, text) to authenticated;

-- Approve a driver (admin only) — powers the admin approval screen.
create or replace function public.approve_driver(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  update public.profiles set status='approved' where id = p_uid;
end $$;
grant execute on function public.approve_driver(uuid) to authenticated;

-- ============================================================================
-- 6) DEMO ONLY — bounded, server-side demo deliveries (max 2 per account).
--    Remove this function before a real launch so hours come only from
--    code-verified deliveries.
-- ============================================================================
create or replace function public.seed_demo_deliveries()
returns void language plpgsql security definer set search_path = public as $$
declare have int; site_id uuid; nm text; i int;
begin
  select count(*) into have from public.pickups where student_id=auth.uid() and status='delivered';
  if have >= 2 then return; end if;
  select id into site_id from public.dropoff_sites where active order by name limit 1;
  select name into nm from public.profiles where id=auth.uid();
  for i in (have+1)..2 loop
    insert into public.pickups(business_id,business_name,food,category,quantity,pickup_window,pickup_address,dropoff_site_id,status,hours_credit,student_id,student_name)
    values(auth.uid(),'Maple Street Café','Sandwiches & salads','Prepared','~15 meals','Completed','—',site_id,'delivered',1.5,auth.uid(),coalesce(nm,'You'));
  end loop;
end $$;
grant execute on function public.seed_demo_deliveries() to authenticated;
