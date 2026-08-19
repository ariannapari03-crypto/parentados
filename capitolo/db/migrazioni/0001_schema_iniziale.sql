-- Migrazione 0001 — schema iniziale di Capitolo.
--
-- Regola operativa (vedi CLAUDE.md): una migrazione applicata non si modifica
-- mai. Per cambiare lo schema si aggiunge una nuova migrazione (0002, 0003, ...).
--
-- Scelte che riflettono gli invarianti:
--   * Le date sono per DIPARTIMENTO (sessione + scadenza), le regole per CORSO.
--     Sono due rami separati e non vanno collassati in una tabella sola. [inv. 3]
--   * `data_da` è NULLABLE: una scadenza esiste anche senza data pubblicata,
--     e va resa visibile come lacuna, non stimata. [inv. 1]
--   * `fonte_url` e `fonte_citazione` sono NOT NULL su scadenza e regola:
--     senza fonte l'estrazione è fallita, non parziale. [inv. 2]
--   * `stato` default 'proposta'; solo una persona porta a 'confermata';
--     le pagine pubbliche filtrano sempre su 'confermata'. [inv. 4]
--   * `documento` conserva il grezzo integrale + hash del contenuto. [inv. 6]
--   * `regola.vincolante` default false: i consigli restano consigli. [inv. 9]

begin;

-- Domini condivisi ------------------------------------------------------------

-- Stato del ciclo di vita di un'affermazione estratta.
create type stato_affermazione as enum ('proposta', 'confermata', 'scartata');

-- Tipo del documento scaricato.
create type tipo_documento as enum ('html', 'pdf', 'altro');

-- Esito di un tentativo di estrazione.
create type esito_estrazione as enum ('riuscita', 'fallita', 'parziale');


-- Anagrafica ------------------------------------------------------------------

create table ateneo (
  id            bigint generated always as identity primary key,
  nome          text not null,
  dominio_mail  text,               -- es. 'unibo.it', per euristiche future
  cms           text,               -- es. 'plone', 'wordpress': guida scraping
  note          text,
  verificato_il timestamptz,        -- ultima verifica umana dell'anagrafica
  creato_il     timestamptz not null default now()
);

create table dipartimento (
  id             bigint generated always as identity primary key,
  ateneo_id      bigint not null references ateneo(id) on delete cascade,
  nome           text not null,
  sigla          text,              -- es. 'SPS' per Politica a Bologna
  url_calendario text,              -- pagina/PDF del calendario sedute
  creato_il      timestamptz not null default now()
);

create table corso (
  id               bigint generated always as identity primary key,
  ateneo_id        bigint not null references ateneo(id) on delete cascade,
  dipartimento_id  bigint references dipartimento(id) on delete set null,
  nome             text not null,
  livello          text,            -- es. 'L', 'LM', 'LMCU'
  classe           text,            -- classe di laurea, es. 'LM-84'
  url_prova_finale text,            -- pagina delle regole della prova finale
  creato_il        timestamptz not null default now()
);


-- Documenti scaricati e loro estrazioni --------------------------------------

create table documento (
  id               bigint generated always as identity primary key,
  url              text not null,
  tipo             tipo_documento not null,
  contenuto_grezzo bytea not null,          -- grezzo integrale (HTML o PDF) [inv. 6]
  hash             text not null,           -- hash del contenuto (es. sha256 hex)
  scaricato_il     timestamptz not null default now(),
  -- catena degli allegati: un PDF scoperto dentro una pagina punta al documento
  -- della pagina che lo ha rimandato. [inv. 5]
  origine_id       bigint references documento(id) on delete set null
);

-- Per accorgersi quando un ateneo cambia una pagina: stesso url, hash diverso.
create index documento_url_idx  on documento(url);
create index documento_hash_idx on documento(hash);

create table estrazione (
  id              bigint generated always as identity primary key,
  documento_id    bigint not null references documento(id) on delete cascade,
  modello         text not null,          -- id del modello usato
  prompt_versione text not null,          -- versione del prompt in lib/estrattore.ts
  costo           numeric(10, 6),         -- costo stimato in euro/dollari
  esito           esito_estrazione not null,
  creato_il       timestamptz not null default now()
);

create index estrazione_documento_idx on estrazione(documento_id);


-- Ramo DATE: per dipartimento ------------------------------------------------

create table sessione (
  id              bigint generated always as identity primary key,
  dipartimento_id bigint not null references dipartimento(id) on delete cascade,
  nome            text not null,          -- es. 'Sessione estiva'
  anno_accademico text not null,          -- es. '2024/2025'
  seduta_da       date,                   -- inizio finestra delle sedute
  seduta_a        date,                   -- fine finestra delle sedute
  creato_il       timestamptz not null default now()
);

create index sessione_dipartimento_idx on sessione(dipartimento_id);

create table scadenza (
  id              bigint generated always as identity primary key,
  sessione_id     bigint not null references sessione(id) on delete cascade,
  tipo            text not null,          -- es. 'domanda_laurea', 'consegna_tesi'
  nome            text,                   -- etichetta leggibile
  data_da         date,                   -- NULLABLE: lacuna, mai stimata [inv. 1]
  data_a          date,
  blocca          boolean not null default false,  -- scadenza perentoria?
  fonte_url       text not null,          -- [inv. 2]
  fonte_citazione text not null,          -- la frase esatta [inv. 2]
  confidenza      real,                   -- 0..1, confidenza dell'estrazione
  stato           stato_affermazione not null default 'proposta',  -- [inv. 4]
  documento_id    bigint references documento(id) on delete set null,
  creato_il       timestamptz not null default now()
);

create index scadenza_sessione_idx on scadenza(sessione_id);
create index scadenza_stato_idx    on scadenza(stato);


-- Ramo REGOLE: per corso ------------------------------------------------------

create table regola (
  id              bigint generated always as identity primary key,
  corso_id        bigint not null references corso(id) on delete cascade,
  classe          text,                   -- classe di laurea, se la regola è di classe
  tipo            text,                   -- es. 'lunghezza', 'formato', 'criterio_voto'
  testo           text not null,          -- la regola in chiaro
  valore          jsonb,                  -- forma strutturata, se disponibile
  vincolante      boolean not null default false,  -- i consigli restano consigli [inv. 9]
  fonte_url       text not null,          -- [inv. 2]
  fonte_citazione text not null,          -- la frase esatta [inv. 2]
  confidenza      real,
  stato           stato_affermazione not null default 'proposta',  -- [inv. 4]
  documento_id    bigint references documento(id) on delete set null,
  creato_il       timestamptz not null default now()
);

create index regola_corso_idx on regola(corso_id);
create index regola_stato_idx on regola(stato);

commit;
