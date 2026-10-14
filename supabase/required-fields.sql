-- =====================================================================
-- Required fields, enforced by the database itself.
--
-- The admin panel and the app already check these before saving, but anything that talks to
-- the database directly (the SQL editor, a script, a bug) could skip those checks. These rules
-- make the database refuse bad rows as well.
--
-- Run it ONCE in the Supabase SQL Editor (safe to run again).
-- Every rule is added "not valid": old rows are left alone, new and edited rows must follow it.
-- =====================================================================

do $$
declare r record;
begin
  for r in select * from (values
    -- table, constraint name, rule
    ('batches',           'req_batches',           'btrim(name) <> ''''' ),
    ('companies',         'req_companies',         'btrim(company) <> '''' and btrim(contact_name) <> '''' and email = lower(btrim(email)) and email like ''%@%.%'' and phone ~ ''^[0-9]{10}$'' and (type = ''shipper'' or btrim(mc_number) <> '''') and (type = ''broker'' or (btrim(city) <> '''' and char_length(btrim(state)) = 2))'),
    ('trucks',            'req_trucks',            'btrim(unit_number) <> '''' and btrim(plate) <> '''' and capacity_lbs > 0 and length_ft > 0 and mpg > 0 and btrim(location_city) <> '''' and char_length(btrim(location_state)) = 2'),
    ('drivers',           'req_drivers',           'btrim(name) <> '''' and btrim(license_no) <> '''' and phone ~ ''^[0-9]{10}$'' and experience_years >= 0 and pay_per_mile > 0 and btrim(home_city) <> '''''),
    ('loads',             'req_loads',             'btrim(origin_city) <> '''' and btrim(dest_city) <> '''' and char_length(btrim(origin_state)) = 2 and char_length(btrim(dest_state)) = 2 and weight_lbs > 0 and length_ft > 0 and loaded_miles > 0 and deadhead_miles >= 0 and btrim(commodity) <> '''' and (posted_rate is null or posted_rate > 0) and (delivery_date is null or pickup_date is null or delivery_date >= pickup_date)'),
    ('shipper_requests',  'req_shipper_requests',  'btrim(origin_city) <> '''' and btrim(dest_city) <> '''' and char_length(btrim(origin_state)) = 2 and char_length(btrim(dest_state)) = 2 and weight_lbs > 0 and offered_rate > 0 and btrim(commodity) <> '''''),
    ('document_templates','req_document_templates','btrim(name) <> '''' and cardinality(fields) > 0'),
    ('negotiation_rules', 'req_negotiation_rules', 'btrim(name) <> '''' and opening_offer > 0 and min_rate > 0 and min_rate <= target_rate and target_rate <= max_rate and max_rounds between 1 and 10 and step_percent >= 0'),
    ('scoring_profiles',  'req_scoring_profiles',  'btrim(name) <> '''' and pass_mark between 0 and 100'),
    ('courses',           'req_courses',           'btrim(title) <> '''''),
    ('lessons',           'req_lessons',           'btrim(title) <> '''' and duration_min > 0'),
    ('scenarios',         'req_scenarios',         'btrim(title) <> '''' and time_limit_min > 0 and max_attempts > 0'),
    -- A scenario can only be published when a student can actually play it.
    ('scenarios',         'req_scenarios_publish', 'status = ''draft'' or (negotiation_rule_id is not null and scoring_profile_id is not null and cardinality(truck_ids) > 0 and cardinality(driver_ids) > 0 and ((role = ''dispatcher'' and cardinality(load_ids) > 0) or (role = ''broker'' and shipper_id is not null)))')
  ) as t(tbl, cname, rule)
  loop
    execute format('alter table public.%I drop constraint if exists %I', r.tbl, r.cname);
    execute format('alter table public.%I add constraint %I check (%s) not valid', r.tbl, r.cname, r.rule);
  end loop;
end $$;

-- Check: lists the rules that were added.
select conrelid::regclass as table_name, conname as rule
from pg_constraint
where conname like 'req\_%'
order by 1, 2;
