import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, chiudi } from '../lib/db';

// Applica le migrazioni non ancora applicate, in ordine.
//
// Regola operativa: una migrazione applicata non si modifica mai; se ne aggiunge
// una nuova (vedi CLAUDE.md). Questo script tiene traccia di quali file sono già
// stati eseguiti in una tabella `_migrazioni`, così `db:push` è idempotente e
// applica solo le novità.

const qui = dirname(fileURLToPath(import.meta.url));
const cartellaMigrazioni = join(qui, '..', 'db', 'migrazioni');

async function assicuraRegistro(): Promise<void> {
  await pool().query(`
    create table if not exists _migrazioni (
      nome        text primary key,
      applicata_il timestamptz not null default now()
    )
  `);
}

async function giaApplicate(): Promise<Set<string>> {
  const res = await pool().query<{ nome: string }>('select nome from _migrazioni');
  return new Set(res.rows.map((r) => r.nome));
}

function fileMigrazioni(): string[] {
  return readdirSync(cartellaMigrazioni)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // 0001_, 0002_, ... l'ordine lessicografico è l'ordine di applicazione
}

async function applica(nome: string): Promise<void> {
  const sql = readFileSync(join(cartellaMigrazioni, nome), 'utf8');
  const client = await pool().connect();
  try {
    // Ogni file gestisce la propria transazione (begin/commit). Registriamo
    // l'applicazione nella stessa connessione, subito dopo.
    await client.query(sql);
    await client.query('insert into _migrazioni (nome) values ($1)', [nome]);
    console.log(`  applicata  ${nome}`);
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  await assicuraRegistro();
  const applicate = await giaApplicate();
  const tutte = fileMigrazioni();
  const daFare = tutte.filter((n) => !applicate.has(n));

  if (daFare.length === 0) {
    console.log(`Nessuna migrazione da applicare (${tutte.length} già presenti).`);
    return;
  }

  console.log(`Applico ${daFare.length} migrazione/i:`);
  for (const nome of daFare) {
    await applica(nome);
  }
  console.log('Fatto.');
}

main()
  .then(() => chiudi())
  .catch(async (err) => {
    console.error('Errore in db:push:', err);
    await chiudi();
    process.exit(1);
  });
