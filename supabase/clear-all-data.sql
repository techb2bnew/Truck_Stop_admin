-- =====================================================================
-- DANGER: deletes ALL data except the admin accounts.
--
-- Kept:    admin and trainer accounts (profiles with role super_admin / trainer),
--          their sign-in accounts, and the single app_settings row.
-- Deleted: students (profile AND sign-in account), batches, courses, lessons, scenarios,
--          loads, rate insights, trucks, drivers, brokers, shippers, requests, negotiation
--          rules, scoring profiles, documents, assignments, attempts, notifications.
--
-- Run it in the Supabase SQL Editor. It cannot be undone.
-- It runs as one transaction: if anything fails, nothing is deleted.
-- =====================================================================

begin;

delete from public.attempt_events;
delete from public.attempts;
delete from public.assignments;
delete from public.saved_items;
delete from public.notifications;
delete from public.scenarios;
delete from public.rate_insights;
delete from public.shipper_requests;
delete from public.loads;
delete from public.drivers;
delete from public.trucks;
delete from public.companies;
delete from public.negotiation_rules;
delete from public.scoring_profiles;
delete from public.document_templates;
delete from public.lessons;
delete from public.courses;
delete from public.batches;

-- Students: removing the sign-in account also removes the profile row (cascade).
delete from auth.users where id in (select id from public.profiles where role = 'student');

commit;

-- Check: every table should be 0, except profiles (your admins) and app_settings (1).
select 'profiles (admins left)' as table_name, count(*) as rows from public.profiles
union all select 'app_settings', count(*) from public.app_settings
union all select 'students', count(*) from public.profiles where role = 'student'
union all select 'batches', count(*) from public.batches
union all select 'courses', count(*) from public.courses
union all select 'scenarios', count(*) from public.scenarios
union all select 'loads', count(*) from public.loads
union all select 'trucks', count(*) from public.trucks
union all select 'drivers', count(*) from public.drivers
union all select 'companies', count(*) from public.companies
union all select 'assignments', count(*) from public.assignments
union all select 'attempts', count(*) from public.attempts;
