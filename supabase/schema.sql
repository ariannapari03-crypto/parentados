-- Schema per l'app "Case Vacanze Famiglia".
-- Da eseguire nel SQL editor di Supabase (progetto vuoto) prima del primo utilizzo.

create extension if not exists "pgcrypto";

-- Elenco famiglia, condiviso tra tutti i dispositivi (spec 2, 3)
create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ruolo text not null check (ruolo in ('nipote', 'adulto')),
  created_at timestamptz not null default now()
);

-- Soggiorni (spec 3, 4.1). house_id referenzia le case statiche definite in src/data/houses.ts
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  house_id text not null,
  data_inizio date not null,
  data_fine date not null,
  partecipanti uuid[] not null default '{}',
  stagione text not null check (stagione in ('estate', 'inverno')),
  inizio_stagione boolean not null default false,
  fine_stagione boolean not null default false,
  created_by uuid references family_members(id),
  created_at timestamptz not null default now(),
  constraint date_order check (data_fine >= data_inizio)
);

create index if not exists bookings_house_id_idx on bookings (house_id);

-- Stato checklist di apertura/chiusura per ogni soggiorno (spec 3)
create table if not exists checklist_states (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  flow text not null check (flow in ('apertura', 'chiusura')),
  steps jsonb not null default '{}',
  completato_quando timestamptz,
  unique (booking_id, flow)
);

-- Oggetti in transito tra un soggiorno e l'altro (spec 3, 4.6)
create table if not exists handoff_items (
  id uuid primary key default gen_random_uuid(),
  house_id text not null,
  descrizione text not null,
  segnalato_da uuid references family_members(id),
  data_segnalazione timestamptz not null default now(),
  stato text not null default 'da_portare' check (stato in ('da_portare', 'consegnato')),
  auto_generato boolean not null default false,
  booking_origine_id uuid references bookings(id)
);

create index if not exists handoff_items_house_id_idx on handoff_items (house_id);

-- Guasti/segnalazioni (spec 3, 4.4)
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  house_id text not null,
  descrizione text not null,
  segnalato_da uuid references family_members(id),
  data timestamptz not null default now(),
  stato text not null default 'aperto' check (stato in ('aperto', 'risolto'))
);

create index if not exists issues_house_id_idx on issues (house_id);

-- Task condivise tra case collegate, es. erbacce-limone-2026 (spec 3, 4.8)
create table if not exists shared_task_states (
  id text primary key,
  group_id text not null,
  anno integer not null,
  fatto boolean not null default false,
  da uuid references family_members(id),
  quando timestamptz
);

-- App famigliare senza autenticazione reale: RLS abilitata con policy permissive
-- per il ruolo anon, dato che l'accesso e' gia' limitato a chi ha il link dell'app.
alter table family_members enable row level security;
alter table bookings enable row level security;
alter table checklist_states enable row level security;
alter table handoff_items enable row level security;
alter table issues enable row level security;
alter table shared_task_states enable row level security;

drop policy if exists "family_members_all" on family_members;
create policy "family_members_all" on family_members for all using (true) with check (true);

drop policy if exists "bookings_all" on bookings;
create policy "bookings_all" on bookings for all using (true) with check (true);

drop policy if exists "checklist_states_all" on checklist_states;
create policy "checklist_states_all" on checklist_states for all using (true) with check (true);

drop policy if exists "handoff_items_all" on handoff_items;
create policy "handoff_items_all" on handoff_items for all using (true) with check (true);

drop policy if exists "issues_all" on issues;
create policy "issues_all" on issues for all using (true) with check (true);

drop policy if exists "shared_task_states_all" on shared_task_states;
create policy "shared_task_states_all" on shared_task_states for all using (true) with check (true);

-- Abilita la sincronizzazione realtime tra i dispositivi della famiglia
alter publication supabase_realtime add table family_members;
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table checklist_states;
alter publication supabase_realtime add table handoff_items;
alter publication supabase_realtime add table issues;
alter publication supabase_realtime add table shared_task_states;
