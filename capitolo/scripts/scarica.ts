import 'dotenv/config';
import { scaricaConAllegati } from '../lib/scarica.js';
import { chiudi } from '../lib/db.js';

// Uso: tsx scripts/scarica.ts <url>
//
// Scarica la pagina all'URL dato, ne conserva il grezzo + hash, segue i PDF
// allegati e li salva legati alla pagina. [inv. 5, 6]

async function main(): Promise<void> {
  const url = process.argv[2];
  if (!url) {
    console.error('Uso: tsx scripts/scarica.ts <url>');
    process.exit(2);
  }

  const esito = await scaricaConAllegati(url);
  console.log(`Pagina salvata: documento #${esito.paginaId}`);
  if (esito.allegati.length === 0) {
    console.log('Nessun allegato PDF trovato.');
  } else {
    console.log(`${esito.allegati.length} allegato/i seguito/i:`);
    for (const a of esito.allegati) {
      console.log(`  documento #${a.documentoId}  ${a.url}`);
    }
  }
}

main()
  .then(() => chiudi())
  .catch(async (err) => {
    console.error('Errore in scarica:', err);
    await chiudi();
    process.exit(1);
  });
