import 'dotenv/config';
import { pool, chiudi } from '../lib/db.js';
import { ritaglia } from '../lib/ritaglio.js';
import { estraiTestoPdf } from '../lib/pdf.js';
import { clienteAnthropic, estraiCalendario, estraiRegole } from '../lib/estrattore.js';
import { salvaCalendario, salvaRegole } from '../lib/persistenza.js';

// Uso:
//   tsx scripts/estrai.ts --documento <id> --calendario --dipartimento <id>
//   tsx scripts/estrai.ts --documento <id> --regole --corso <id>
//
// Carica un documento salvato (compito ②), ne ricava il testo (ritaglio se HTML,
// testo se PDF), chiama il modello e salva le PROPOSTE. La chiave del modello si
// legge solo dall'ambiente (ANTHROPIC_API_KEY). [inv. 8]

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(nome);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function flag(nome: string): boolean {
  return process.argv.includes(nome);
}

async function testoDelDocumento(id: number): Promise<{ testo: string; url: string }> {
  const res = await pool().query<{ url: string; tipo: string; contenuto_grezzo: Buffer }>(
    'select url, tipo, contenuto_grezzo from documento where id = $1',
    [id]
  );
  if (res.rows.length === 0) throw new Error(`documento #${id} inesistente`);
  const doc = res.rows[0];
  const corpo = Buffer.from(doc.contenuto_grezzo);
  if (doc.tipo === 'pdf') {
    return { testo: await estraiTestoPdf(corpo), url: doc.url };
  }
  // html o altro: ritaglia. [inv. 7]
  return { testo: ritaglia(corpo.toString('utf8')).testo, url: doc.url };
}

async function main(): Promise<void> {
  const documentoId = Number(arg('--documento'));
  if (!documentoId) {
    console.error('Manca --documento <id>');
    process.exit(2);
  }
  const { testo, url } = await testoDelDocumento(documentoId);
  const cliente = clienteAnthropic();

  if (flag('--calendario')) {
    const dipartimentoId = Number(arg('--dipartimento'));
    if (!dipartimentoId) { console.error('Manca --dipartimento <id>'); process.exit(2); }
    const esito = await estraiCalendario(testo, url, cliente);
    const salvato = await salvaCalendario(dipartimentoId, documentoId, esito);
    console.log(`Calendario: esito=${esito.esito}, scartate=${esito.scartate}, scadenze inserite=${salvato.scadenzeInserite} (estrazione #${salvato.estrazioneId})`);
  } else if (flag('--regole')) {
    const corsoId = Number(arg('--corso'));
    if (!corsoId) { console.error('Manca --corso <id>'); process.exit(2); }
    const esito = await estraiRegole(testo, url, cliente);
    const salvato = await salvaRegole(corsoId, documentoId, esito);
    console.log(`Regole: esito=${esito.esito}, scartate=${esito.scartate}, regole inserite=${salvato.regoleInserite} (estrazione #${salvato.estrazioneId})`);
  } else {
    console.error('Specifica --calendario o --regole');
    process.exit(2);
  }
}

main()
  .then(() => chiudi())
  .catch(async (err) => {
    console.error('Errore in estrai:', err);
    await chiudi();
    process.exit(1);
  });
