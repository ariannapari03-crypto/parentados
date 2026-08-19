# Capitolo

Raccoglitore di regole e scadenze della tesi dagli atenei italiani, e pagine
pubbliche generate da quei dati. Le regole del progetto — gli **invarianti** —
stanno in [`CLAUDE.md`](./CLAUDE.md) e vengono prima di tutto.

Next.js (App Router) + TypeScript + Postgres. Un solo progetto, niente monorepo.

## Struttura

```
capitolo/
├── CLAUDE.md              ← invarianti, non negoziabili
├── app/                   ← Next.js, App Router
│   ├── (pubbliche)/       ← le pagine SEO, una per corso (compito ⑥)
│   └── revisione/         ← interfaccia di revisione, protetta (compito ⑤)
├── scripts/
│   ├── db-push.ts         ← applica le migrazioni non ancora applicate
│   ├── scopri.ts          ← enumera i corsi di un ateneo (compito ⑦)
│   ├── scarica.ts         ← scarica pagine e allegati, grezzo + hash (compito ②)
│   ├── estrai.ts          ← chiama il modello, produce proposte (compito ④)
│   └── pubblica.ts        ← rigenera le pagine pubbliche (compito ⑥)
├── lib/
│   ├── db.ts              ← pool Postgres, letto da DATABASE_URL
│   ├── estrattore.ts      ← i prompt, versionati (compito ④)
│   └── ritaglio.ts        ← toglie menu e piè di pagina (compito ③)
├── db/migrazioni/         ← le migrazioni SQL, in ordine, immutabili
└── test/
    ├── fixtures/          ← pagine reali salvate; i test non chiamano gli atenei
    └── db.test.ts         ← test di lettura/scrittura
```

## Avvio

```bash
cp .env.example .env      # e valorizza DATABASE_URL
npm install
npm run db:push           # crea/aggiorna le tabelle
npm test                  # test di lettura/scrittura (richiede DATABASE_URL)
npm run dev               # server di sviluppo Next.js
```

`DATABASE_URL` punta a un Postgres (Neon o Supabase; il piano gratuito basta per
i primi mesi). Nessun segreto entra nel repository: solo variabili d'ambiente.

## Migrazioni

Lo schema si evolve aggiungendo file in `db/migrazioni/` (`0002_…`, `0003_…`).
Una migrazione applicata **non si modifica mai**: `db:push` tiene traccia di
quelle già eseguite in `_migrazioni` e applica solo le novità.

## I sette compiti

Si costruisce un pezzo per volta, ognuno con un criterio secco di completamento
(vedi il brief). Stato in `CLAUDE.md`. Fatto finora:

- ① **Impalcatura e schema** — `db:push` crea le tabelle, il test passa. ✅
- ② **Scarica con allegati** — `tsx scripts/scarica.ts <url>` salva grezzo + hash e segue i PDF allegati (riquadro «In evidenza» di Plone), legandoli alla pagina. ✅

  ```bash
  npx tsx scripts/scarica.ts https://corsi.unibo.it/.../requisiti-e-scadenze
  ```
