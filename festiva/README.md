# FESTIVA

Webapp mobile-first (installabile come PWA) per organizzare feste ed eventi e
scoprire i **locali partner di Alba con le loro promozioni riservate**.

Ricostruzione — molto migliore — del prototipo originale: qui i dati sono reali
e persistenti, le schermate condividono lo stato, e il motore delle promozioni
funziona davvero.

## Stack

- **React + TypeScript + Vite**
- **Tailwind CSS v4** (mobile-first, tema FESTIVA registrato correttamente)
- **Supabase** (Postgres + Auth + Realtime) come backend condiviso
- **PWA** installabile (`vite-plugin-pwa`)
- **i18n** bilingue **IT / EN** (italiano di default)

## Architettura

Una sola app, tre ruoli su `profiles.role`:

- **organizer** — organizza eventi, invita, prenota, riscatta promozioni
- **partner** — pubblica la propria scheda e le promozioni, vede i riscatti
- **admin** — supervisione

Login con **email + password** (Supabase Auth). Il ruolo si sceglie in fase di
registrazione; l'app mostra il guscio giusto (bottom-nav diversa per ruolo).

## Setup

### 1. Progetto Supabase

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. Nell'**SQL editor** esegui [`supabase/schema.sql`](./supabase/schema.sql):
   crea tabelle, ruoli, policy RLS e il trigger che genera il profilo alla
   registrazione.
3. In **Project Settings → API** copia `Project URL` e `anon public key`.

### 2. Variabili d'ambiente

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
```

Senza queste variabili l'app mostra una schermata di setup invece di avviarsi.

### 3. Avvio

```bash
npm install
npm run dev
```

Build di produzione:

```bash
npm run build
npm run preview
```

## Stato (roadmap)

- [x] **Fase 0 — Fondamenta**: scaffolding, tema, i18n IT/EN, PWA, login
      email+password con ruoli, schema database completo.
- [ ] Fase 1 — Eventi & Dashboard (wizard 5 step, persistenza)
- [ ] Fase 2 — Checklist & Budget
- [ ] Fase 3 — Invitati & RSVP
- [ ] Fase 4 — Marketplace & Promozioni (riscatto codice/QR)
- [ ] Fase 5 — Area Locale self-service
- [ ] Fase 6 — Rifinitura (accessibilità, seed dati Alba, test)
