-- =====================================================================
-- Practice flow: run this ONCE in the Supabase SQL Editor (safe to run again).
--
-- 1. An attempt can now be "in_progress" while the student is still working on it.
-- 2. Students can no longer write attempts or attempt events themselves. Everything a student
--    does in a practice goes through the "practice" Edge Function, which checks the rules
--    (negotiation, scoring) on the server so nobody can fake a result. Students can still READ their own.
-- =====================================================================

alter table public.attempts drop constraint if exists attempts_status_check;
alter table public.attempts
  add constraint attempts_status_check check (status in ('in_progress', 'pending_review', 'approved', 'retry'));

drop policy if exists "students submit own attempts" on public.attempts;
drop policy if exists "students add own events" on public.attempt_events;

-- Check: students keep only read access to their own attempts and events.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename in ('attempts', 'attempt_events')
order by tablename, policyname;
