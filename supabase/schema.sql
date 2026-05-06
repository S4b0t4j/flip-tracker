-- Real Estate Portfolio Tracker - Schema
-- Run this in Supabase SQL Editor

-- ============================================================================
-- USERS (extends auth.users)
-- ============================================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- PROPERTIES
-- ============================================================================
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  address text not null,
  zillow_link text,
  purchase_price numeric(12,2),
  acquisition_date date,
  estimated_arv numeric(12,2),
  current_stage text not null default 'Sourcing'
    check (current_stage in (
      'Sourcing','Under Contract','Acquired','Pre-Renovation',
      'In Renovation','Hold/Staging','Listed','Sold','Closed','Failed'
    )),
  target_reno_completion date,
  target_sale_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_properties_user on public.properties(user_id);
create index if not exists idx_properties_stage on public.properties(current_stage);

-- ============================================================================
-- CONTRACTORS  (defined before expenses since expenses references it)
-- ============================================================================
create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  scope_of_work text,
  cost_rate numeric(12,2),
  cost_type text default 'Fixed' check (cost_type in ('Fixed','Hourly','Per Day','Other')),
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_contractors_property on public.contractors(property_id);

-- ============================================================================
-- REHAB BUDGETS
-- ============================================================================
create table if not exists public.rehab_budgets (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category text not null,
  budgeted_amount numeric(12,2) default 0,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_budgets_property on public.rehab_budgets(property_id);

-- ============================================================================
-- EXPENSES
-- ============================================================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  description text,
  contractor_id uuid references public.contractors(id) on delete set null,
  receipt_image_url text,
  date_incurred date default current_date,
  created_at timestamptz default now()
);
create index if not exists idx_expenses_property on public.expenses(property_id);
create index if not exists idx_expenses_contractor on public.expenses(contractor_id);
create index if not exists idx_expenses_date on public.expenses(date_incurred desc);

-- ============================================================================
-- PHOTOS
-- ============================================================================
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  image_url text not null,
  caption text,
  status_at_time text,
  uploaded_at timestamptz default now()
);
create index if not exists idx_photos_property on public.photos(property_id);

-- ============================================================================
-- STATUS LOG
-- ============================================================================
create table if not exists public.status_log (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  old_stage text,
  new_stage text,
  changed_at timestamptz default now(),
  changed_by uuid references public.users(id) on delete set null
);
create index if not exists idx_status_property on public.status_log(property_id, changed_at desc);

-- ============================================================================
-- MILESTONES
-- ============================================================================
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  milestone_type text not null,
  target_date date,
  actual_date date,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_milestones_property on public.milestones(property_id);

-- ============================================================================
-- FEEDBACK LOGS
-- ============================================================================
create table if not exists public.feedback_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('Feature Request','Bug Report')),
  severity text check (severity in ('Low','Medium','High')),
  title text not null,
  description text,
  screenshot_url text,
  context text,
  email text,
  status text default 'New' check (status in ('New','In Review','Resolved','Wont Fix')),
  created_at timestamptz default now()
);
create index if not exists idx_feedback_user on public.feedback_logs(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.contractors enable row level security;
alter table public.rehab_budgets enable row level security;
alter table public.expenses enable row level security;
alter table public.photos enable row level security;
alter table public.status_log enable row level security;
alter table public.milestones enable row level security;
alter table public.feedback_logs enable row level security;

-- USERS
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users for select using (auth.uid() = id);
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- PROPERTIES (full CRUD on own rows)
drop policy if exists "properties_select_own" on public.properties;
create policy "properties_select_own" on public.properties for select using (user_id = auth.uid());
drop policy if exists "properties_insert_own" on public.properties;
create policy "properties_insert_own" on public.properties for insert with check (user_id = auth.uid());
drop policy if exists "properties_update_own" on public.properties;
create policy "properties_update_own" on public.properties for update using (user_id = auth.uid());
drop policy if exists "properties_delete_own" on public.properties;
create policy "properties_delete_own" on public.properties for delete using (user_id = auth.uid());

-- Helper: check property ownership
create or replace function public.owns_property(prop_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (select 1 from public.properties where id = prop_id and user_id = auth.uid());
$$;

-- CHILD TABLES: full CRUD via property ownership
do $$
declare
  tbl text;
begin
  foreach tbl in array array['contractors','rehab_budgets','expenses','photos','status_log','milestones']
  loop
    execute format('drop policy if exists "%I_select" on public.%I', tbl, tbl);
    execute format('create policy "%I_select" on public.%I for select using (public.owns_property(property_id))', tbl, tbl);
    execute format('drop policy if exists "%I_insert" on public.%I', tbl, tbl);
    execute format('create policy "%I_insert" on public.%I for insert with check (public.owns_property(property_id))', tbl, tbl);
    execute format('drop policy if exists "%I_update" on public.%I', tbl, tbl);
    execute format('create policy "%I_update" on public.%I for update using (public.owns_property(property_id))', tbl, tbl);
    execute format('drop policy if exists "%I_delete" on public.%I', tbl, tbl);
    execute format('create policy "%I_delete" on public.%I for delete using (public.owns_property(property_id))', tbl, tbl);
  end loop;
end $$;

-- FEEDBACK
drop policy if exists "feedback_select_own" on public.feedback_logs;
create policy "feedback_select_own" on public.feedback_logs for select using (user_id = auth.uid());
drop policy if exists "feedback_insert_own" on public.feedback_logs;
create policy "feedback_insert_own" on public.feedback_logs for insert with check (user_id = auth.uid());

-- ============================================================================
-- AUTO-LOG STATUS CHANGES
-- ============================================================================
create or replace function public.log_status_change()
returns trigger language plpgsql as $$
begin
  if new.current_stage is distinct from old.current_stage then
    insert into public.status_log (property_id, old_stage, new_stage, changed_by)
    values (new.id, old.current_stage, new.current_stage, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_status on public.properties;
create trigger trg_log_status after update on public.properties
for each row execute function public.log_status_change();

-- ============================================================================
-- STORAGE BUCKETS  (run once)
-- ============================================================================
-- Run separately in Supabase Storage UI or via API:
-- create bucket "property-photos" (public read, authenticated write)
-- create bucket "receipts" (private, authenticated)
