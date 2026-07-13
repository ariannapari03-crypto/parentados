# Case Vacanze Famiglia

Webapp mobile-first (installabile come PWA) per gestire l'apertura/chiusura delle case vacanze di famiglia: calendario prenotazioni, checklist guidate di apertura/chiusura, oggetti in transito tra un soggiorno e l'altro, guasti condivisi e storico di chi ha aperto/chiuso cosa.

Vedi la spec funzionale completa fornita per il dettaglio di regole e checklist.

## Stack

- [Vite](https://vite.dev) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com) (mobile-first)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) per installabilità e funzionamento offline-friendly
- [Supabase](https://supabase.com) (Postgres + Realtime) come backend condiviso tra i dispositivi della famiglia — nessuna autenticazione reale, solo selezione del proprio nome (spec sezione 2)

## Setup

### 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un progetto gratuito.
2. Apri lo **SQL editor** del progetto ed esegui il contenuto di [`supabase/schema.sql`](./supabase/schema.sql). Crea tutte le tabelle, le policy RLS (permissive, dato che l'app non ha un vero login) e abilita la sincronizzazione realtime.
3. Nelle impostazioni del progetto (**Project Settings → API**) copia `Project URL` e `anon public key`.

### 2. Configura le variabili d'ambiente

```bash
cp .env.example .env.local
```

Compila `.env.local` con i valori copiati da Supabase:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
```

Senza queste variabili l'app mostra una schermata di istruzioni invece di avviarsi (nessun dato può essere sincronizzato senza un progetto Supabase collegato).

### 3. Installa ed esegui

```bash
npm install
npm run dev
```

Per la build di produzione:

```bash
npm run build
npm run preview
```

## Note implementative

- **Case**: la configurazione delle 4 case (San Bartolomeo, Limone 3, Limone 9, Sanremo) è statica nel codice (`src/data/houses.ts`), non modificabile da UI, come da spec.
- **Checklist**: generate dinamicamente in base a casa/stagione/inizio-fine soggiorno (`src/data/checklists.ts`), con bivi condizionali (es. lenzuola: lava qui/porta a casa → asciutte sì/no) e task condivise generiche tra case collegate (es. erbacce Limone 3/9), riutilizzabili per gruppi futuri.
- **Foto di verifica**: facoltative, compresse/ridimensionate lato client (`src/lib/imageCompress.ts`) prima di essere salvate come dataURL, per non appesantire lo storage.
- **Notifiche guasti**: nessuna push nativa reale (non possibile con una PWA senza server push dedicato); l'evidenza è data da badge sempre visibile in nav + banner in home, secondo la spec.
- **Sincronizzazione**: tutte le liste (prenotazioni, checklist, guasti, oggetti in transito, task condivise) si aggiornano quasi in tempo reale tra i dispositivi tramite le subscription Realtime di Supabase.
