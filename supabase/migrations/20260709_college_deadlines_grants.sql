-- FIX for 20260709_college_deadlines.sql: the raw CREATE TABLE granted no table
-- privileges to the PostgREST roles, so anon reads AND the edge function's
-- service-role writes fail with "42501 permission denied for table". Run this in
-- the SQL Editor if you already applied the original migration.

grant select on public.college_deadlines to anon, authenticated;
grant select, insert, update on public.college_deadlines to service_role;
