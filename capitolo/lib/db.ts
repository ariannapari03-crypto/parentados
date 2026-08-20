import { Pool } from 'pg';

// Connessione a Postgres. L'unica fonte è la variabile d'ambiente: nessun
// segreto nel codice. [inv. 8]
//
// Un solo pool condiviso per processo. Nei processi server-side (script e route
// API) va bene così; il browser non importa mai questo modulo.

function urlDatabase(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL non impostata. Copia .env.example in .env e valorizzala.'
    );
  }
  return url;
}

let poolCondiviso: Pool | null = null;

// Postgres gestiti (Neon, Supabase, …) richiedono TLS. I loro certificati sono
// emessi da una CA pubblica, quindi la verifica resta attiva. In locale, su
// socket unix o senza sslmode, non si tocca nulla.
function opzioniSsl(url: string): { rejectUnauthorized: boolean } | undefined {
  return /sslmode=require|neon\.tech|supabase\.co|\.rds\.amazonaws\.com/.test(url)
    ? { rejectUnauthorized: true }
    : undefined;
}

export function pool(): Pool {
  if (!poolCondiviso) {
    const url = urlDatabase();
    poolCondiviso = new Pool({ connectionString: url, ssl: opzioniSsl(url) });
  }
  return poolCondiviso;
}

// Scorciatoia per una query singola.
export function query<T extends Record<string, unknown> = Record<string, unknown>>(
  testo: string,
  parametri?: unknown[]
) {
  return pool().query<T>(testo, parametri);
}

// Chiude il pool. Da usare negli script e nei test per far terminare il processo.
export async function chiudi(): Promise<void> {
  if (poolCondiviso) {
    await poolCondiviso.end();
    poolCondiviso = null;
  }
}
