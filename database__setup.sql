-- Royalty Barber Studio — schema inicial para un proyecto Supabase NUEVO.
-- Ejecutar solo una vez en una base vacía. No aplicar sobre los proyectos inactivos existentes.
-- Antes de publicar: confirmar precios, moneda, horarios, teléfono y política de confirmación.

create extension if not exists btree_gist with schema extensions;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create type public.app_role as enum ('CLIENT', 'BARBER', 'ADMIN');
create type public.appointment_status as enum (
  'SOLICITADA', 'CONFIRMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'
);
create type public.payment_status as enum ('PENDIENTE', 'PAGADO', 'PARCIAL', 'FALLIDO', 'REEMBOLSADO');

create sequence public.appointment_code_seq start 1001;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'CLIENT',
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_len check (char_length(full_name) <= 120),
  constraint profiles_phone_len check (phone is null or char_length(phone) <= 40)
);

create table public.business_settings (
  singleton boolean primary key default true check (singleton),
  name text not null default 'Royalty Barber Studio',
  address text,
  phone text,
  instagram_url text,
  timezone text not null default 'America/Caracas',
  currency char(3),
  booking_horizon_days smallint not null default 10 check (booking_horizon_days between 1 and 90),
  booking_min_notice_minutes integer not null default 60 check (booking_min_notice_minutes between 0 and 10080),
  cancellation_min_notice_minutes integer not null default 120 check (cancellation_min_notice_minutes between 0 and 10080),
  is_published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('CORTES', 'BARBA', 'RITUAL')),
  description text not null default '',
  duration_minutes integer not null check (duration_minutes between 5 and 360),
  price numeric(10,2) not null check (price >= 0),
  currency char(3) not null,
  image_path text,
  is_active boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint services_currency_format check (currency ~ '^[A-Z]{3}$')
);

create table public.barbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  slug text not null unique,
  display_name text not null,
  biography text not null default '',
  specialties text[] not null default '{}',
  avatar_path text,
  is_active boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint barbers_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint barbers_display_name_len check (char_length(display_name) between 1 and 120)
);

create table public.barber_services (
  barber_id uuid not null references public.barbers(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (barber_id, service_id)
);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- PostgreSQL: 0 domingo ... 6 sábado
  opens_at time not null,
  closes_at time not null,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barber_id, day_of_week),
  check (is_closed or opens_at < closes_at),
  check (is_closed or (extract(minute from opens_at)::integer % 15 = 0 and extract(second from opens_at)::integer = 0 and extract(minute from closes_at)::integer % 15 = 0 and extract(second from closes_at)::integer = 0))
);

create table public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  exception_date date not null,
  is_closed boolean not null default true,
  opens_at time,
  closes_at time,
  reason text,
  created_at timestamptz not null default now(),
  unique (barber_id, exception_date),
  check ((is_closed and opens_at is null and closes_at is null) or
         (not is_closed and opens_at is not null and closes_at is not null and opens_at < closes_at
          and extract(minute from opens_at)::integer % 15 = 0 and extract(second from opens_at)::integer = 0
          and extract(minute from closes_at)::integer % 15 = 0 and extract(second from closes_at)::integer = 0))
);

create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique default ('RY-' || lpad(nextval('public.appointment_code_seq')::text, 5, '0')),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  barber_id uuid not null references public.barbers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  quoted_price numeric(10,2) not null check (quoted_price >= 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status public.appointment_status not null default 'SOLICITADA',
  customer_note text,
  staff_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  check (customer_note is null or char_length(customer_note) <= 1000),
  check (staff_note is null or char_length(staff_note) <= 2000),
  constraint no_overlapping_active_appointments
    exclude using gist (
      barber_id with =,
      tstzrange(starts_at, ends_at, '[)') with &&
    ) where (status in ('SOLICITADA', 'CONFIRMADA', 'EN_PROCESO'))
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  amount numeric(10,2) not null check (amount >= 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status public.payment_status not null default 'PENDIENTE',
  provider text,
  provider_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid references public.barbers(id) on delete set null,
  title text not null default '',
  category text not null default 'GENERAL' check (category in ('GENERAL', 'FADES', 'TEXTURING', 'FUEGO', 'BARBERIA')),
  storage_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_path)
);

create table public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  customer_id uuid references public.profiles(id) on delete set null,
  consent_at timestamptz not null,
  consent_source text not null,
  is_subscribed boolean not null default true,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_email_format check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint newsletter_source_len check (char_length(consent_source) between 1 and 100)
);
create unique index newsletter_subscriptions_email_lower_uq on public.newsletter_subscriptions (lower(email));

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index appointments_customer_start_idx on public.appointments (customer_id, starts_at desc);
create index appointments_barber_start_idx on public.appointments (barber_id, starts_at);
create index appointments_status_start_idx on public.appointments (status, starts_at);
create index schedule_blocks_barber_start_idx on public.schedule_blocks (barber_id, starts_at, ends_at);
create index gallery_items_public_order_idx on public.gallery_items (sort_order, created_at desc) where is_published;

-- Protected role helpers: no caller-supplied user ID; only the current session is evaluated.
create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_app_role() = 'ADMIN'::public.app_role, false)
$$;

create or replace function private.is_assigned_barber(p_barber_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.barbers b
    where b.id = p_barber_id and b.user_id = auth.uid()
  )
$$;

grant execute on function private.current_app_role() to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated, service_role;
grant execute on function private.is_assigned_barber(uuid) to anon, authenticated, service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger settings_touch_updated_at before update on public.business_settings
  for each row execute function public.touch_updated_at();
create trigger services_touch_updated_at before update on public.services
  for each row execute function public.touch_updated_at();
create trigger barbers_touch_updated_at before update on public.barbers
  for each row execute function public.touch_updated_at();
create trigger schedules_touch_updated_at before update on public.schedules
  for each row execute function public.touch_updated_at();
create trigger appointments_touch_updated_at before update on public.appointments
  for each row execute function public.touch_updated_at();
create trigger payments_touch_updated_at before update on public.payments
  for each row execute function public.touch_updated_at();
create trigger gallery_items_touch_updated_at before update on public.gallery_items
  for each row execute function public.touch_updated_at();
create trigger newsletter_touch_updated_at before update on public.newsletter_subscriptions
  for each row execute function public.touch_updated_at();

-- Appointment rules are enforced in PostgreSQL, not only in the browser.
create or replace function public.validate_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
  v_duration integer;
  v_price numeric(10,2);
  v_currency char(3);
  v_timezone text;
  v_horizon integer;
  v_min_notice integer;
  v_cancel_notice integer;
  v_start_local timestamp;
  v_end_local timestamp;
  v_exception_found boolean := false;
  v_closed boolean;
  v_opens time;
  v_closes time;
  v_validate_schedule boolean := false;
begin
  -- Serialize booking/block operations for this barber so two concurrent requests cannot race.
  perform pg_advisory_xact_lock(hashtextextended('royalty-barber:' || new.barber_id::text, 0));
  v_role := private.current_app_role();

  if tg_op = 'UPDATE' then
    v_validate_schedule := new.starts_at is distinct from old.starts_at
      or new.ends_at is distinct from old.ends_at
      or new.barber_id is distinct from old.barber_id
      or new.service_id is distinct from old.service_id
      or (old.status not in ('SOLICITADA', 'CONFIRMADA', 'EN_PROCESO') and new.status in ('SOLICITADA', 'CONFIRMADA', 'EN_PROCESO'));
    if v_role is distinct from 'ADMIN'::public.app_role then
      if new.customer_id is distinct from old.customer_id
         or new.barber_id is distinct from old.barber_id
         or new.service_id is distinct from old.service_id
         or new.starts_at is distinct from old.starts_at
         or new.ends_at is distinct from old.ends_at
         or new.quoted_price is distinct from old.quoted_price
         or new.currency is distinct from old.currency
         or new.public_code is distinct from old.public_code then
        raise exception 'Los datos centrales de una cita no se pueden cambiar desde este perfil.' using errcode = '42501';
      end if;

      if v_role = 'CLIENT'::public.app_role then
        if new.status <> 'CANCELADA'::public.appointment_status
           or old.status not in ('SOLICITADA', 'CONFIRMADA')
           or old.starts_at <= now() then
          raise exception 'El cliente solo puede cancelar una cita futura solicitada o confirmada.' using errcode = '42501';
        end if;
        select bs.cancellation_min_notice_minutes into v_cancel_notice
          from public.business_settings bs where bs.singleton = true;
        if v_cancel_notice is not null and old.starts_at <= now() + make_interval(mins => v_cancel_notice) then
          raise exception 'La cita está dentro del plazo mínimo de cancelación. Contacta directamente con la barbería.' using errcode = '42501';
        end if;
      elsif v_role = 'BARBER'::public.app_role then
        if not private.is_assigned_barber(old.barber_id) then
          raise exception 'El barbero no tiene permiso sobre esta cita.' using errcode = '42501';
        end if;
        if not (
          (old.status = 'SOLICITADA' and new.status in ('CONFIRMADA', 'CANCELADA')) or
          (old.status = 'CONFIRMADA' and new.status in ('EN_PROCESO', 'CANCELADA')) or
          (old.status = 'EN_PROCESO' and new.status in ('COMPLETADA', 'NO_ASISTIO'))
        ) then
          raise exception 'Transición de estado no permitida.' using errcode = '42501';
        end if;
      else
        raise exception 'No autorizado para modificar citas.' using errcode = '42501';
      end if;
    end if;
  else
    v_validate_schedule := true;
    if v_role not in ('CLIENT'::public.app_role, 'ADMIN'::public.app_role) then
      raise exception 'Solo un cliente autenticado o administrador puede crear una cita.' using errcode = '42501';
    end if;
    if v_role = 'CLIENT'::public.app_role then
      if new.customer_id is distinct from auth.uid() then
        raise exception 'La cita debe pertenecer a la sesión autenticada.' using errcode = '42501';
      end if;
      if new.status <> 'SOLICITADA'::public.appointment_status then
        raise exception 'Una cita nueva debe comenzar como SOLICITADA.' using errcode = '42501';
      end if;
    end if;
  end if;

  -- Snapshot the selected service price/duration on creation. A price change later must not rewrite history.
  if tg_op = 'INSERT' then
    select s.duration_minutes, s.price, s.currency
      into v_duration, v_price, v_currency
      from public.services s
     where s.id = new.service_id and s.is_active and s.is_published;
    if not found then
      raise exception 'El servicio no está disponible para reservar.' using errcode = 'P0001';
    end if;
    if not exists (
      select 1 from public.barbers b
      join public.barber_services bs on bs.barber_id = b.id
      where b.id = new.barber_id and b.is_active and b.is_published and bs.service_id = new.service_id
    ) then
      raise exception 'Este barbero no ofrece el servicio seleccionado.' using errcode = 'P0001';
    end if;
    new.ends_at := new.starts_at + make_interval(mins => v_duration);
    new.quoted_price := v_price;
    new.currency := v_currency;
  end if;

  if new.status in ('SOLICITADA', 'CONFIRMADA', 'EN_PROCESO') and v_validate_schedule then
    select bs.timezone, bs.booking_horizon_days, bs.booking_min_notice_minutes
      into v_timezone, v_horizon, v_min_notice
      from public.business_settings bs where bs.singleton = true and bs.is_published = true;
    if not found then
      raise exception 'La configuración del negocio no está publicada; las reservas están pausadas.' using errcode = 'P0001';
    end if;

    v_start_local := new.starts_at at time zone v_timezone;
    v_end_local := new.ends_at at time zone v_timezone;
    if v_start_local::date <> v_end_local::date then
      raise exception 'La cita debe terminar el mismo día local en que comienza.' using errcode = 'P0001';
    end if;
    if new.starts_at <= now() + make_interval(mins => v_min_notice) then
      raise exception 'La cita debe respetar la antelación mínima.' using errcode = 'P0001';
    end if;
    if v_start_local::date > (now() at time zone v_timezone)::date + v_horizon then
      raise exception 'La fecha supera el horizonte de reservas permitido.' using errcode = 'P0001';
    end if;
    if extract(minute from v_start_local)::integer % 15 <> 0
       or extract(second from v_start_local) <> 0 then
      raise exception 'La hora debe coincidir con un intervalo de 15 minutos.' using errcode = 'P0001';
    end if;

    select true, se.is_closed, se.opens_at, se.closes_at
      into v_exception_found, v_closed, v_opens, v_closes
      from public.schedule_exceptions se
     where se.barber_id = new.barber_id and se.exception_date = v_start_local::date;

    if not coalesce(v_exception_found, false) then
      select true, s.is_closed, s.opens_at, s.closes_at
        into v_exception_found, v_closed, v_opens, v_closes
        from public.schedules s
       where s.barber_id = new.barber_id
         and s.day_of_week = extract(dow from v_start_local)::smallint;
    end if;

    if not coalesce(v_exception_found, false) or coalesce(v_closed, true)
       or v_opens is null or v_closes is null
       or v_start_local::time < v_opens or v_end_local::time > v_closes then
      raise exception 'La hora está fuera del horario de atención.' using errcode = 'P0001';
    end if;

    if exists (
      select 1 from public.schedule_blocks sb
       where sb.barber_id = new.barber_id
         and tstzrange(sb.starts_at, sb.ends_at, '[)') && tstzrange(new.starts_at, new.ends_at, '[)')
    ) then
      raise exception 'La hora está bloqueada por el negocio.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;
revoke all on function public.validate_appointment() from public, anon, authenticated;
create trigger appointments_validate before insert or update on public.appointments
  for each row execute function public.validate_appointment();

-- An admin cannot add a pause/block that silently collides with an active appointment.
create or replace function public.prevent_block_over_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('royalty-barber:' || new.barber_id::text, 0));
  if exists (
    select 1 from public.appointments a
     where a.barber_id = new.barber_id
       and a.status in ('SOLICITADA', 'CONFIRMADA', 'EN_PROCESO')
       and (tg_op = 'INSERT' or a.id is distinct from new.id)
       and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(new.starts_at, new.ends_at, '[)')
  ) then
    raise exception 'No se puede crear ese bloqueo porque coincide con una cita activa.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_block_over_appointment() from public, anon, authenticated;
create trigger schedule_blocks_no_appointment_conflict before insert or update on public.schedule_blocks
  for each row execute function public.prevent_block_over_appointment();

-- Only the server's service-role client may calculate availability; callers receive slots, not customer data.
create or replace function public.get_available_slots(p_service_id uuid, p_barber_id uuid, p_date date)
returns table(starts_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_duration integer;
  v_timezone text;
  v_horizon integer;
  v_min_notice integer;
  v_opens time;
  v_closes time;
  v_closed boolean;
  v_has_schedule boolean := false;
  v_open timestamptz;
  v_close timestamptz;
  v_local_today date;
begin
  select s.duration_minutes into v_duration
    from public.services s
   where s.id = p_service_id and s.is_active and s.is_published;
  if not found then return; end if;

  if not exists (
    select 1 from public.barbers b
    join public.barber_services bs on bs.barber_id = b.id
    where b.id = p_barber_id and b.is_active and b.is_published and bs.service_id = p_service_id
  ) then return; end if;

  select bs.timezone, bs.booking_horizon_days, bs.booking_min_notice_minutes
    into v_timezone, v_horizon, v_min_notice
    from public.business_settings bs where bs.singleton = true and bs.is_published = true;
  if not found then return; end if;

  v_local_today := (now() at time zone v_timezone)::date;
  if p_date < v_local_today or p_date > v_local_today + v_horizon then return; end if;

  select true, se.is_closed, se.opens_at, se.closes_at
    into v_has_schedule, v_closed, v_opens, v_closes
    from public.schedule_exceptions se
   where se.barber_id = p_barber_id and se.exception_date = p_date;

  if not coalesce(v_has_schedule, false) then
    select true, s.is_closed, s.opens_at, s.closes_at
      into v_has_schedule, v_closed, v_opens, v_closes
      from public.schedules s
     where s.barber_id = p_barber_id
       and s.day_of_week = extract(dow from p_date)::smallint;
  end if;

  if not coalesce(v_has_schedule, false) or coalesce(v_closed, true)
     or v_opens is null or v_closes is null then return; end if;

  v_open := (p_date + v_opens) at time zone v_timezone;
  v_close := (p_date + v_closes) at time zone v_timezone;

  return query
    select slot.start_time
      from generate_series(v_open, v_close - make_interval(mins => v_duration), interval '15 minutes') as slot(start_time)
     where slot.start_time > now() + make_interval(mins => v_min_notice)
       and not exists (
         select 1 from public.appointments a
          where a.barber_id = p_barber_id
            and a.status in ('SOLICITADA', 'CONFIRMADA', 'EN_PROCESO')
            and tstzrange(a.starts_at, a.ends_at, '[)') &&
                tstzrange(slot.start_time, slot.start_time + make_interval(mins => v_duration), '[)')
       )
       and not exists (
         select 1 from public.schedule_blocks sb
          where sb.barber_id = p_barber_id
            and tstzrange(sb.starts_at, sb.ends_at, '[)') &&
                tstzrange(slot.start_time, slot.start_time + make_interval(mins => v_duration), '[)')
       )
     order by slot.start_time;
end;
$$;
revoke all on function public.get_available_slots(uuid, uuid, date) from public, anon, authenticated;
grant execute on function public.get_available_slots(uuid, uuid, date) to service_role;

-- Row Level Security: every exposed business table is protected.
alter table public.profiles enable row level security;
alter table public.business_settings enable row level security;
alter table public.services enable row level security;
alter table public.barbers enable row level security;
alter table public.barber_services enable row level security;
alter table public.schedules enable row level security;
alter table public.schedule_exceptions enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.gallery_items enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.audit_logs enable row level security;

-- Table grants are explicit; RLS then limits rows.
revoke all privileges on all tables in schema public from anon, authenticated;
grant all privileges on all tables in schema public to service_role;
grant usage, select on sequence public.appointment_code_seq to authenticated, service_role;
grant select on public.profiles to authenticated;
grant update(full_name, phone) on public.profiles to authenticated;
grant select on public.business_settings, public.services, public.barbers, public.barber_services,
  public.schedules, public.gallery_items to anon, authenticated;
grant select, insert, update on public.appointments to authenticated;
grant select on public.payments to authenticated;
grant select on public.schedule_exceptions, public.schedule_blocks to authenticated;
grant select on public.audit_logs to authenticated;
grant insert, update, delete on public.business_settings, public.services, public.barbers, public.barber_services,
  public.schedules, public.schedule_exceptions, public.schedule_blocks, public.gallery_items,
  public.payments, public.newsletter_subscriptions to authenticated;

create policy profiles_read_self_or_admin on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy settings_read_published on public.business_settings
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy settings_admin_all on public.business_settings
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy services_read_published on public.services
  for select to anon, authenticated using ((is_active and is_published) or (select private.is_admin()));
create policy services_admin_all on public.services
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy barbers_read_published on public.barbers
  for select to anon, authenticated using ((is_active and is_published) or (select private.is_admin()) or (user_id = (select auth.uid())));
create policy barbers_admin_all on public.barbers
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy barber_services_read_public on public.barber_services
  for select to anon, authenticated using (
    exists (select 1 from public.services s where s.id = service_id and s.is_active and s.is_published)
    and exists (select 1 from public.barbers b where b.id = barber_id and b.is_active and b.is_published)
  );
create policy barber_services_admin_all on public.barber_services
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy schedules_read_public on public.schedules
  for select to anon, authenticated using (
    exists (select 1 from public.barbers b where b.id = barber_id and b.is_active and b.is_published)
    or (select private.is_admin()) or (select private.is_assigned_barber(barber_id))
  );
create policy schedules_admin_all on public.schedules
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy schedules_barber_manage_own on public.schedules
  for update to authenticated using ((select private.is_assigned_barber(barber_id))) with check ((select private.is_assigned_barber(barber_id)));

create policy exceptions_admin_read on public.schedule_exceptions
  for select to authenticated using ((select private.is_admin()) or (select private.is_assigned_barber(barber_id)));
create policy exceptions_admin_all on public.schedule_exceptions
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy blocks_admin_read on public.schedule_blocks
  for select to authenticated using ((select private.is_admin()) or (select private.is_assigned_barber(barber_id)));
create policy blocks_admin_all on public.schedule_blocks
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy appointments_read_own_barber_admin on public.appointments
  for select to authenticated using (
    customer_id = (select auth.uid()) or (select private.is_assigned_barber(barber_id)) or (select private.is_admin())
  );
create policy appointments_insert_self on public.appointments
  for insert to authenticated with check (
    customer_id = (select auth.uid())
    and status = 'SOLICITADA'
    and (select private.current_app_role()) = 'CLIENT'::public.app_role
  );
create policy appointments_client_cancel on public.appointments
  for update to authenticated
  using (customer_id = (select auth.uid()) and status in ('SOLICITADA', 'CONFIRMADA') and starts_at > now())
  with check (customer_id = (select auth.uid()) and status = 'CANCELADA');
create policy appointments_barber_update on public.appointments
  for update to authenticated
  using ((select private.is_assigned_barber(barber_id)))
  with check ((select private.is_assigned_barber(barber_id)));
create policy appointments_admin_all on public.appointments
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy payments_read_owner_barber_admin on public.payments
  for select to authenticated using (
    exists (select 1 from public.appointments a where a.id = appointment_id
      and (a.customer_id = (select auth.uid()) or (select private.is_assigned_barber(a.barber_id)) or (select private.is_admin())))
  );
create policy payments_admin_all on public.payments
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy gallery_read_published on public.gallery_items
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy gallery_admin_all on public.gallery_items
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy newsletter_read_own_or_admin on public.newsletter_subscriptions
  for select to authenticated using (customer_id = (select auth.uid()) or (select private.is_admin()));
create policy newsletter_admin_all on public.newsletter_subscriptions
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated using ((select private.is_admin()));

-- Log appointment creation and state transitions without storing secrets or card data.
create or replace function private.log_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    auth.uid(),
    case when tg_op = 'INSERT' then 'APPOINTMENT_CREATED' else 'APPOINTMENT_UPDATED' end,
    'appointments',
    coalesce(new.id, old.id)::text,
    case when tg_op = 'UPDATE' then jsonb_build_object('status', old.status, 'starts_at', old.starts_at, 'ends_at', old.ends_at) else null end,
    jsonb_build_object('status', new.status, 'starts_at', new.starts_at, 'ends_at', new.ends_at, 'public_code', new.public_code)
  );
  return new;
end;
$$;
revoke all on function private.log_appointment_change() from public, anon, authenticated;
create trigger appointments_audit after insert or update on public.appointments
  for each row execute function private.log_appointment_change();

-- One-time administrator bootstrap. Only the server-only service_role can invoke this function.
create or replace function public.bootstrap_initial_admin(p_user_id uuid, p_expected_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  perform pg_advisory_xact_lock(hashtext('royalty-initial-admin-bootstrap'));
  select lower(u.email) into v_email
    from auth.users u
   where u.id = p_user_id and u.email_confirmed_at is not null;
  if v_email is null or v_email <> lower(trim(p_expected_email)) then
    return false;
  end if;
  if exists (select 1 from public.profiles p where p.role = 'ADMIN'::public.app_role) then
    return exists (select 1 from public.profiles p where p.id = p_user_id and p.role = 'ADMIN'::public.app_role);
  end if;
  update public.profiles set role = 'ADMIN'::public.app_role where id = p_user_id;
  return found;
end;
$$;
revoke all on function public.bootstrap_initial_admin(uuid, text) from public, anon, authenticated;
grant execute on function public.bootstrap_initial_admin(uuid, text) to service_role;

-- Storage: private image bucket; public pages receive expiring signed URLs for published items. Administrator-only uploads/replacement/deletion.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('royalty-gallery', 'royalty-gallery', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy royalty_gallery_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'royalty-gallery' and (select private.is_admin()));
create policy royalty_gallery_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'royalty-gallery' and (select private.is_admin()))
  with check (bucket_id = 'royalty-gallery' and (select private.is_admin()));
create policy royalty_gallery_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'royalty-gallery' and (select private.is_admin()));

-- Only a draft business record is seeded. It is NOT public until phone, schedule, services and prices are verified.
insert into public.business_settings (singleton, name, address, instagram_url, timezone, is_published)
values (true, 'Royalty Barber Studio', 'Cerca de Av. 6, Calle Lara, Sanare 3028, Lara, Venezuela',
        'https://instagram.com/royaltybarberstudio2026', 'America/Caracas', false)
on conflict (singleton) do nothing;

-- Draft barber identity based on the project handover. Kept unpublished until biography/photo/details are reviewed.
insert into public.barbers (slug, display_name, biography, is_active, is_published, sort_order)
values ('emmanuel-rose', 'Emmanuel Rose', '', true, false, 1)
on conflict (slug) do nothing;

-- No example service prices or schedules are inserted: the planning PDF marks them provisional.
