# Deploy — GitHub · Vercel · Supabase

Guida per mettere online FESTIVA senza altri strumenti oltre a questi tre.

## 1. Supabase (il backend)

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. Apri **SQL editor** ed esegui, in ordine:
   - [`supabase/schema.sql`](./supabase/schema.sql) — tabelle, ruoli, policy, trigger
   - [`supabase/seed.sql`](./supabase/seed.sql) — locali e promozioni d'esempio di Alba
3. In **Project Settings → API** copia:
   - `Project URL` → sarà `VITE_SUPABASE_URL`
   - `anon public` key → sarà `VITE_SUPABASE_ANON_KEY`
4. In **Authentication → Providers → Email**: lascia attivo *Email*.
   - Per provare in fretta puoi disattivare *Confirm email* (l'utente entra
     subito). In produzione, tienilo attivo.
5. In **Authentication → URL Configuration**: come *Site URL* metti l'indirizzo
   Vercel che otterrai al punto 2 (es. `https://festiva.vercel.app`).

## 2. Vercel (l'hosting)

1. Vai su [vercel.com](https://vercel.com) e fai **Add New → Project**,
   importando il repository GitHub.
2. **Importante — Root Directory**: imposta `festiva` (il progetto vive in
   quella sottocartella, non nella radice del repo).
3. Framework preset: **Vite** (rilevato in automatico). Build command
   `npm run build`, output `dist` — già corretti di default.
4. In **Environment Variables** aggiungi:

   | Nome | Valore |
   |------|--------|
   | `VITE_SUPABASE_URL` | il Project URL di Supabase |
   | `VITE_SUPABASE_ANON_KEY` | la anon public key |

5. **Deploy**. Al termine avrai l'URL pubblico.
6. Torna su Supabase (punto 1.5) e assicurati che il *Site URL* corrisponda
   all'URL Vercel.

Il file [`vercel.json`](./vercel.json) contiene già il rewrite che fa
funzionare le rotte dell'app (es. ricaricare `/app/promo` non dà 404).

## 3. Aggiornamenti

Ogni push sul branch collegato fa ripartire il deploy in automatico su Vercel.
Nessun passaggio manuale.

## Note

- Le variabili `VITE_*` sono incluse nel bundle lato client: la anon key di
  Supabase è pensata per questo (le policy RLS proteggono i dati). **Non**
  usare qui la `service_role` key.
- La PWA è installabile: da mobile, "Aggiungi a schermata Home".
