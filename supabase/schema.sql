-- =====================================================================
-- Truck Stop: database schema (20 tables), security rules and realtime.
-- Run this ONCE in Supabase: SQL Editor > New query > paste > Run.
-- It is safe to run again; it only creates what is missing.
-- =====================================================================

-- ---------- 1. Tables ----------

-- Every person: admins, trainers and students. Linked to Supabase Auth.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null default '',
  phone       text not null default '',
  role        text not null default 'student' check (role in ('super_admin', 'trainer', 'student')),
  roles       text[] not null default '{}',                 -- student practice roles: dispatcher, broker
  batch_id    uuid,
  status      text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  app_access  boolean not null default true,
  invite_status text not null default 'pending' check (invite_status in ('pending', 'accepted')),
  created_at  timestamptz not null default now()
);

create table if not exists public.batches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  trainer_id  uuid references public.profiles (id) on delete set null,
  description text not null default '',
  start_date  date,
  created_at  timestamptz not null default now()
);

do $$ begin
  alter table public.profiles
    add constraint profiles_batch_fk foreign key (batch_id) references public.batches (id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  audience    text not null default 'both' check (audience in ('dispatcher', 'broker', 'both')),
  status      text not null default 'draft' check (status in ('draft', 'published')),
  created_at  timestamptz not null default now()
);

create table if not exists public.lessons (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  title        text not null,
  type         text not null default 'video' check (type in ('video', 'pdf', 'text')),
  duration_min int not null default 10,
  sort_order   int not null default 1,
  content      text not null default '',
  created_at   timestamptz not null default now()
);

-- Brokers and shippers live together; "type" tells them apart.
create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('broker', 'shipper')),
  company       text not null,
  contact_name  text not null default '',
  email         text not null default '',
  phone         text not null default '',
  address       text not null default '',      -- broker
  mc_number     text not null default '',      -- broker
  credit_rating text not null default 'B',     -- broker
  days_to_pay   int  not null default 30,      -- broker
  city          text not null default '',      -- shipper
  state         text not null default '',      -- shipper
  industry      text not null default '',      -- shipper
  created_at    timestamptz not null default now()
);

create table if not exists public.negotiation_rules (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  opening_offer  numeric not null default 0,
  target_rate    numeric not null default 0,
  min_rate       numeric not null default 0,
  max_rate       numeric not null default 0,
  max_rounds     int not null default 3,
  step_percent   numeric not null default 3,
  accept_message  text not null default '',
  counter_message text not null default '',
  reject_message  text not null default '',
  created_at     timestamptz not null default now()
);

-- Criteria and weights are stored as a list inside the profile:
-- [{"key":"rate","label":"Rate vs target","weight":30}, ...]
create table if not exists public.scoring_profiles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  pass_mark  int not null default 70,
  criteria   jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.loads (
  id             uuid primary key default gen_random_uuid(),
  origin_city    text not null,
  origin_state   text not null,
  dest_city      text not null,
  dest_state     text not null,
  pickup_date    date,
  delivery_date  date,
  equipment      text not null default 'Van' check (equipment in ('Van', 'Reefer', 'Flatbed')),
  size           text not null default 'Full' check (size in ('Full', 'Partial')),
  weight_lbs     int not null default 0,
  length_ft      int not null default 53,
  commodity      text not null default '',
  loaded_miles   int not null default 0,
  deadhead_miles int not null default 0,
  posted_rate    numeric,                       -- null means "No rate posted"
  broker_id      uuid references public.companies (id) on delete set null,
  posted_at      timestamptz not null default now(),
  notes          text not null default '',
  created_at     timestamptz not null default now()
);

-- One row per load: the estimate plus the 4-week trend.
-- trend: [{"weekStart":"2026-09-21","avgRate":1110}, ...]
create table if not exists public.rate_insights (
  id         uuid primary key default gen_random_uuid(),
  load_id    uuid not null unique references public.loads (id) on delete cascade,
  low        numeric not null default 0,
  booked     numeric not null default 0,
  high       numeric not null default 0,
  confidence text not null default 'Medium' check (confidence in ('High', 'Medium', 'Low')),
  trend      jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.trucks (
  id             uuid primary key default gen_random_uuid(),
  unit_number    text not null,
  equipment      text not null default 'Van' check (equipment in ('Van', 'Reefer', 'Flatbed')),
  make           text not null default '',
  year           int not null default 2022,
  plate          text not null default '',
  capacity_lbs   int not null default 45000,
  length_ft      int not null default 53,
  mpg            numeric not null default 7,
  location_city  text not null default '',
  location_state text not null default '',
  status         text not null default 'available' check (status in ('available', 'in_use', 'maintenance')),
  created_at     timestamptz not null default now()
);

create table if not exists public.drivers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  phone            text not null default '',
  license_no       text not null default '',
  experience_years int not null default 1,
  home_city        text not null default '',
  pay_per_mile     numeric not null default 0.6,
  truck_id         uuid references public.trucks (id) on delete set null,
  availability     text not null default 'available' check (availability in ('available', 'on_trip', 'off_duty')),
  created_at       timestamptz not null default now()
);

create table if not exists public.shipper_requests (
  id           uuid primary key default gen_random_uuid(),
  shipper_id   uuid not null references public.companies (id) on delete cascade,
  origin_city  text not null,
  origin_state text not null,
  dest_city    text not null,
  dest_state   text not null,
  pickup_date  date,
  equipment    text not null default 'Van' check (equipment in ('Van', 'Reefer', 'Flatbed')),
  weight_lbs   int not null default 0,
  commodity    text not null default '',
  offered_rate numeric not null default 0,
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

create table if not exists public.document_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null default 'other' check (type in ('rate_confirmation', 'bol', 'pod', 'other')),
  description text not null default '',
  file_name   text not null default '',
  fields      text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- A scenario carries its own lists of loads, trucks, drivers and documents,
-- and its events: [{"id":"..","atMinute":20,"type":"pickup_delay","description":".."}]
create table if not exists public.scenarios (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  role                text not null default 'dispatcher' check (role in ('dispatcher', 'broker')),
  difficulty          text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
  background          text not null default '',
  instructions        text not null default '',
  time_limit_min      int not null default 30,
  max_attempts        int not null default 3,
  load_ids            uuid[] not null default '{}',
  truck_ids           uuid[] not null default '{}',
  driver_ids          uuid[] not null default '{}',
  document_ids        uuid[] not null default '{}',
  broker_id           uuid references public.companies (id) on delete set null,
  shipper_id          uuid references public.companies (id) on delete set null,
  negotiation_rule_id uuid references public.negotiation_rules (id) on delete set null,
  scoring_profile_id  uuid references public.scoring_profiles (id) on delete set null,
  events              jsonb not null default '[]',
  status              text not null default 'draft' check (status in ('draft', 'published')),
  created_at          timestamptz not null default now()
);

create table if not exists public.assignments (
  id            uuid primary key default gen_random_uuid(),
  scenario_id   uuid not null references public.scenarios (id) on delete cascade,
  student_id    uuid not null references public.profiles (id) on delete cascade,
  assigned_at   date not null default current_date,
  due_date      date not null,
  status        text not null default 'assigned' check (status in ('assigned', 'in_progress', 'submitted', 'reviewed', 'retry')),
  attempts_used int not null default 0,
  created_at    timestamptz not null default now()
);

-- One row per attempt. The score breakdown and the trainer review live here too.
create table if not exists public.attempts (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references public.assignments (id) on delete cascade,
  student_id     uuid not null references public.profiles (id) on delete cascade,
  scenario_id    uuid not null references public.scenarios (id) on delete cascade,
  attempt_no     int not null default 1,
  submitted_at   timestamptz not null default now(),
  auto_score     int not null default 0,
  trainer_score  int,
  time_spent_min int not null default 0,
  mistakes       text[] not null default '{}',
  breakdown      jsonb not null default '[]',               -- [{"key":"rate","score":22}, ...]
  status         text not null default 'pending_review' check (status in ('in_progress', 'pending_review', 'approved', 'retry')),
  trainer_comment text,
  decision       text check (decision in ('approved', 'retry')),
  reviewed_by    uuid references public.profiles (id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

-- Everything a student does inside an attempt: actions, broker chat, documents, bids, rate feedback.
create table if not exists public.attempt_events (
  id         uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  type       text not null check (type in ('action', 'message', 'document', 'bid', 'rate_feedback')),
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('assignment', 'deadline', 'feedback', 'announcement')),
  title      text not null,
  body       text not null default '',
  target     text not null default 'all' check (target in ('all', 'batch', 'student')),
  target_id  uuid,
  created_at timestamptz not null default now()
);

-- Saved loads and saved searches of a student.
create table if not exists public.saved_items (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('load', 'search')),
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Always exactly one row (id = 1).
create table if not exists public.app_settings (
  id                    int primary key default 1 check (id = 1),
  fuel_cost_per_mile    numeric not null default 0.55,
  driver_pay_per_mile   numeric not null default 0.62,
  deadhead_rate_per_mile numeric not null default 0.4,
  default_max_attempts  int not null default 3,
  default_pass_mark     int not null default 70,
  organisation          text not null default 'Truck Stop Academy'
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

create index if not exists idx_profiles_batch on public.profiles (batch_id);
create index if not exists idx_lessons_course on public.lessons (course_id);
create index if not exists idx_assignments_student on public.assignments (student_id);
create index if not exists idx_attempts_student on public.attempts (student_id);
create index if not exists idx_attempts_assignment on public.attempts (assignment_id);
create index if not exists idx_events_attempt on public.attempt_events (attempt_id);

-- ---------- 2. Helpers and triggers ----------

-- True when the signed-in user is an admin or trainer.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('super_admin', 'trainer')
  );
$$;

create or replace function public.my_batch() returns uuid
language sql stable security definer set search_path = public as $$
  select batch_id from public.profiles where id = auth.uid();
$$;

-- Every new Supabase Auth user gets a profile. The role is always "student" here;
-- admins are promoted with the SQL at the bottom of this file, never from the client.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- When an invited student signs in for the first time, mark the invite as accepted.
create or replace function public.handle_user_signed_in() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.last_sign_in_at is not null and new.last_sign_in_at is distinct from old.last_sign_in_at then
    update public.profiles set invite_status = 'accepted'
    where id = new.id and invite_status = 'pending';
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_signed_in on auth.users;
create trigger on_auth_user_signed_in
  after update of last_sign_in_at on auth.users
  for each row execute function public.handle_user_signed_in();

-- ---------- 3. Row Level Security ----------

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'batches', 'courses', 'lessons', 'companies', 'negotiation_rules', 'scoring_profiles',
    'loads', 'rate_insights', 'trucks', 'drivers', 'shipper_requests', 'document_templates', 'scenarios',
    'assignments', 'attempts', 'attempt_events', 'notifications', 'saved_items', 'app_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admins manage everything" on public.%I', t);
    execute format(
      'create policy "admins manage everything" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;

-- Students: read only what the practice needs. Negotiation rules and scoring profiles stay admin-only
-- so students can never read target rates or scoring weights.
do $$
declare t text;
begin
  foreach t in array array[
    'loads', 'rate_insights', 'trucks', 'drivers', 'companies', 'shipper_requests', 'document_templates', 'app_settings'
  ] loop
    execute format('drop policy if exists "students read sample data" on public.%I', t);
    execute format('create policy "students read sample data" on public.%I for select to authenticated using (true)', t);
  end loop;
end $$;

drop policy if exists "students read own profile" on public.profiles;
create policy "students read own profile" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "students read own batch" on public.batches;
create policy "students read own batch" on public.batches for select to authenticated using (id = public.my_batch());

drop policy if exists "students read published courses" on public.courses;
create policy "students read published courses" on public.courses for select to authenticated using (status = 'published');

drop policy if exists "students read published lessons" on public.lessons;
create policy "students read published lessons" on public.lessons for select to authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and c.status = 'published'));

drop policy if exists "students read published scenarios" on public.scenarios;
create policy "students read published scenarios" on public.scenarios for select to authenticated using (status = 'published');

drop policy if exists "students read own assignments" on public.assignments;
create policy "students read own assignments" on public.assignments for select to authenticated using (student_id = auth.uid());

drop policy if exists "students read own attempts" on public.attempts;
create policy "students read own attempts" on public.attempts for select to authenticated using (student_id = auth.uid());
-- Students only read their attempts. Starting, working on and submitting a practice goes through the
-- "practice" Edge Function, which enforces the rules on the server.

drop policy if exists "students read own events" on public.attempt_events;
create policy "students read own events" on public.attempt_events for select to authenticated using (student_id = auth.uid());

drop policy if exists "students read their notifications" on public.notifications;
create policy "students read their notifications" on public.notifications for select to authenticated
  using (
    target = 'all'
    or (target = 'student' and target_id = auth.uid())
    or (target = 'batch' and target_id = public.my_batch())
  );

drop policy if exists "students manage own saved items" on public.saved_items;
create policy "students manage own saved items" on public.saved_items for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ---------- 4. Realtime on every table ----------

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'batches', 'courses', 'lessons', 'companies', 'negotiation_rules', 'scoring_profiles',
    'loads', 'rate_insights', 'trucks', 'drivers', 'shipper_requests', 'document_templates', 'scenarios',
    'assignments', 'attempts', 'attempt_events', 'notifications', 'saved_items', 'app_settings'
  ] loop
    execute format('alter table public.%I replica identity full', t);
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- =====================================================================
-- 5. Make yourself the admin (run this separately, after you created the
--    admin user in Authentication > Users). Put your own email below.
-- =====================================================================
-- update public.profiles
--    set role = 'super_admin', full_name = 'Admin Senior', invite_status = 'accepted'
--  where email = 'your-admin-email@example.com';
