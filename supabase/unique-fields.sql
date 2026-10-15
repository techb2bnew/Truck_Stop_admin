-- =====================================================================
-- No duplicates, enforced by the database itself.
--
-- The admin panel already warns before saving a duplicate, but anything that talks to the database
-- directly (the SQL editor, a script, two admins saving at the same moment) could still create one.
-- These rules make the database refuse it as well. Case and spaces do not matter.
--
--   Students   : email, phone
--   Drivers    : CDL number, phone
--   Brokers    : email, MC number
--   Shippers   : email
--   Trucks     : unit number, plate
--   Batches    : name
--
-- Run it ONCE in the Supabase SQL Editor (safe to run again).
-- If some rows are ALREADY duplicates, that one rule is skipped and a notice tells you which one.
-- Fix those rows, then run this script again. The query at the bottom lists what is still missing.
-- =====================================================================

do $$
declare r record;
begin
  for r in select * from (values
    ('uq_students_email',   'public.profiles',  '(lower(btrim(email)))',               'role = ''student'' and btrim(email) <> '''''),
    ('uq_students_phone',   'public.profiles',  '(btrim(phone))',                       'role = ''student'' and btrim(phone) <> '''''),
    ('uq_drivers_license',  'public.drivers',   '(lower(btrim(license_no)))',           'btrim(license_no) <> '''''),
    ('uq_drivers_phone',    'public.drivers',   '(btrim(phone))',                       'btrim(phone) <> '''''),
    ('uq_brokers_email',    'public.companies', '(lower(btrim(email)))',                'type = ''broker'' and btrim(email) <> '''''),
    ('uq_brokers_mc',       'public.companies', '(lower(btrim(mc_number)))',            'type = ''broker'' and btrim(mc_number) <> '''''),
    ('uq_shippers_email',   'public.companies', '(lower(btrim(email)))',                'type = ''shipper'' and btrim(email) <> '''''),
    ('uq_trucks_unit',      'public.trucks',    '(lower(btrim(unit_number)))',          'btrim(unit_number) <> '''''),
    ('uq_trucks_plate',     'public.trucks',    '(lower(btrim(plate)))',                'btrim(plate) <> '''''),
    ('uq_batches_name',     'public.batches',   '(lower(btrim(name)))',                 'btrim(name) <> ''''')
  ) as t(idx, tbl, expr, cond)
  loop
    begin
      execute format('create unique index if not exists %I on %s %s where %s', r.idx, r.tbl, r.expr, r.cond);
    exception when unique_violation then
      raise notice 'SKIPPED % : the table already has duplicates. Fix them and run this script again.', r.idx;
    end;
  end loop;
end $$;

-- Check: the rules that are in place. Anything missing from this list was skipped because of old duplicates.
select indexname as rule, tablename as table_name
from pg_indexes
where schemaname = 'public' and indexname like 'uq\_%'
order by tablename, indexname;
