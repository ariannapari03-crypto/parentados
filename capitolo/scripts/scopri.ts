import 'dotenv/config';
import { chiudi } from '../lib/db';
import { ricognizioneAteneo } from '../lib/ricognizione';
import { cercatoreAnthropic } from '../lib/cercatore';

// Uso: tsx scripts/scopri.ts "Università di Bologna" ["Università di Torino" ...]
//
// Per ogni ateneo scritto sulla riga di comando: lo cerca sul momento sul web,
// apre il catalogo e salva i corsi scoperti (da verificare). Nessun elenco fisso
// di atenei nel codice.

async function main(): Promise<void> {
  const atenei = process.argv.slice(2);
  if (atenei.length === 0) {
    console.error('Uso: tsx scripts/scopri.ts "<nome ateneo>" ["<altro ateneo>" ...]');
    process.exit(2);
  }
  const cerca = cercatoreAnthropic();
  for (const nome of atenei) {
    const esito = await ricognizioneAteneo(nome, { cerca });
    console.log(
      `${nome}: catalogo=${esito.catalogoUrl ?? '—'}, scoperti=${esito.scoperti.length}, nuovi=${esito.nuovi} (ateneo #${esito.ateneoId})`
    );
  }
}

main()
  .then(() => chiudi())
  .catch(async (err) => {
    console.error('Errore in scopri:', err);
    await chiudi();
    process.exit(1);
  });
