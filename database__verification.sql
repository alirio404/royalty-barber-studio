-- Ejecutar en el SQL Editor del proyecto NUEVO después de setup.sql.
-- Solo consulta estado; no modifica datos.

-- 1) Las tablas de negocio deben existir y todas deben tener RLS activado.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('profiles','business_settings','services','barbers','barber_services','schedules',
                    'schedule_exceptions','schedule_blocks','appointments','payments','gallery_items',
                    'newsletter_subscriptions','audit_logs')
order by c.relname;

-- 2) Enumerate policies so they can be checked against the intended role matrix.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public','storage')
  and (schemaname = 'storage' or tablename in ('profiles','business_settings','services','barbers',
       'barber_services','schedules','schedule_exceptions','schedule_blocks','appointments','payments',
       'gallery_items','newsletter_subscriptions','audit_logs'))
order by schemaname, tablename, policyname;

-- 3) Initial seed records must still be drafts until the owner verifies them.
select singleton, name, is_published, timezone, phone
from public.business_settings where singleton = true;
select slug, display_name, is_active, is_published, biography
from public.barbers order by sort_order;
select count(*) as seeded_services from public.services;
select count(*) as seeded_schedules from public.schedules;

-- 4) Ensure service-role-only functions have not accidentally been granted to public users.
select routine_schema, routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('get_available_slots','bootstrap_initial_admin')
order by routine_name, grantee;
