-- ============================================================================
--  FESTIVA — schema del database (Postgres / Supabase)
--  Esegui questo file nell'SQL editor del progetto Supabase.
--  Copre: profili + ruoli, eventi, checklist, budget, invitati,
--  catalogo partner, promozioni e prenotazioni, con Row Level Security.
-- ============================================================================

-- ---------- Tipi enumerati -------------------------------------------------
do $$ begin
  create type festiva_role       as enum ('organizer', 'partner', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type festiva_event_type as enum ('laurea','birthday','wedding','corporate','anniversary','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type festiva_category   as enum ('venue','catering','photography','decorations','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type festiva_discount   as enum ('percent','fixed','package');
exception when duplicate_object then null; end $$;

do $$ begin
  create type festiva_rsvp       as enum ('pending','confirmed','declined');
exception when duplicate_object then null; end $$;

do $$ begin
  create type festiva_priority   as enum ('high','medium','low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type festiva_booking    as enum ('requested','confirmed','paid','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type festiva_plan       as enum ('trial','active','paused');
exception when duplicate_object then null; end $$;

-- ---------- profiles -------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  email        text,
  avatar       text,
  role         festiva_role not null default 'organizer',
  locale       text not null default 'it',
  created_at   timestamptz not null default now()
);

-- ---------- events ---------------------------------------------------------
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  type         festiva_event_type not null default 'other',
  title        text not null default '',
  event_date   date,
  event_time   time,
  duration_h   numeric not null default 4,
  guest_count  integer not null default 0,
  guest_type   text,
  budget_total numeric not null default 0,
  city         text not null default 'Alba',
  area         text,
  venue_type   text,
  status       text not null default 'planning',
  created_at   timestamptz not null default now()
);
create index if not exists events_owner_idx on public.events (owner_id);

-- ---------- partners (catalogo locali / fornitori) -------------------------
create table if not exists public.partners (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references public.profiles (id) on delete set null,
  name          text not null,
  category      festiva_category not null default 'venue',
  city          text not null default 'Alba',
  area          text,
  price_min     numeric,
  price_max     numeric,
  rating        numeric,
  reviews_count integer not null default 0,
  description   text,
  image_url     text,
  featured      boolean not null default false,
  plan          festiva_plan not null default 'trial',
  created_at    timestamptz not null default now()
);
create index if not exists partners_city_idx on public.partners (city);
create index if not exists partners_owner_idx on public.partners (owner_id);

-- ---------- promotions -----------------------------------------------------
create table if not exists public.promotions (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references public.partners (id) on delete cascade,
  title         text not null,
  description   text,
  discount_type festiva_discount not null default 'percent',
  value         numeric,
  min_guests    integer,
  valid_from    date,
  valid_to      date,
  terms         text,
  code_prefix   text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists promotions_partner_idx on public.promotions (partner_id);

-- ---------- bookings (prenotazioni + riscatto promo) -----------------------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events (id) on delete cascade,
  partner_id      uuid not null references public.partners (id) on delete cascade,
  promotion_id    uuid references public.promotions (id) on delete set null,
  status          festiva_booking not null default 'requested',
  amount          numeric,
  deposit         numeric,
  redemption_code text,
  redeemed_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists bookings_event_idx on public.bookings (event_id);
create index if not exists bookings_partner_idx on public.bookings (partner_id);

-- ---------- tasks (checklist) ----------------------------------------------
create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  title      text not null default '',
  category   text not null default 'other',
  due_date   date,
  priority   festiva_priority not null default 'medium',
  completed  boolean not null default false,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists tasks_event_idx on public.tasks (event_id);

-- ---------- expenses (budget) ----------------------------------------------
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  booking_id  uuid references public.bookings (id) on delete set null,
  description text not null default '',
  amount      numeric not null default 0,
  spent_on    date,
  category    text not null default 'other',
  created_at  timestamptz not null default now()
);
create index if not exists expenses_event_idx on public.expenses (event_id);

-- ---------- guests ---------------------------------------------------------
create table if not exists public.guests (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  name       text not null default '',
  email      text,
  phone      text,
  rsvp       festiva_rsvp not null default 'pending',
  dietary    text,
  plus_one   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists guests_event_idx on public.guests (event_id);

-- ============================================================================
--  Trigger: crea automaticamente il profilo alla registrazione,
--  leggendo ruolo e nome dai metadati passati in fase di sign-up.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::festiva_role, 'organizer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
--  Row Level Security
-- ============================================================================
alter table public.profiles   enable row level security;
alter table public.events     enable row level security;
alter table public.partners   enable row level security;
alter table public.promotions enable row level security;
alter table public.bookings   enable row level security;
alter table public.tasks      enable row level security;
alter table public.expenses   enable row level security;
alter table public.guests     enable row level security;

-- profiles: ciascuno vede e modifica il proprio profilo
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- events: l'organizzatore gestisce i propri eventi
drop policy if exists events_owner on public.events;
create policy events_owner on public.events
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- helper: l'evento appartiene all'utente corrente?
create or replace function public.owns_event(evt uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.events e where e.id = evt and e.owner_id = auth.uid());
$$;

-- tasks / expenses / guests: accessibili se l'evento è dell'utente
drop policy if exists tasks_by_event on public.tasks;
create policy tasks_by_event on public.tasks
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

drop policy if exists expenses_by_event on public.expenses;
create policy expenses_by_event on public.expenses
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

drop policy if exists guests_by_event on public.guests;
create policy guests_by_event on public.guests
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

-- partners: lettura pubblica (marketplace), scrittura del proprietario
drop policy if exists partners_read on public.partners;
create policy partners_read on public.partners
  for select using (true);

drop policy if exists partners_write on public.partners;
create policy partners_write on public.partners
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- promotions: lettura pubblica, gestione del partner proprietario
drop policy if exists promotions_read on public.promotions;
create policy promotions_read on public.promotions
  for select using (true);

drop policy if exists promotions_write on public.promotions;
create policy promotions_write on public.promotions
  for all
  using (exists (select 1 from public.partners p where p.id = partner_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.partners p where p.id = partner_id and p.owner_id = auth.uid()));

-- bookings: l'organizzatore gestisce le prenotazioni dei propri eventi;
-- il partner può leggere quelle rivolte al proprio locale
drop policy if exists bookings_organizer on public.bookings;
create policy bookings_organizer on public.bookings
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

drop policy if exists bookings_partner_read on public.bookings;
create policy bookings_partner_read on public.bookings
  for select
  using (exists (select 1 from public.partners p where p.id = partner_id and p.owner_id = auth.uid()));

-- ============================================================================
--  Realtime (facoltativo): sincronizzazione tra dispositivi
-- ============================================================================
do $$ begin
  alter publication supabase_realtime add table
    public.events, public.tasks, public.expenses, public.guests, public.bookings;
exception when others then null; end $$;
