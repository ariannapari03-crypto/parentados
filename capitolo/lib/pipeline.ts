import { query } from './db';
import { scaricaConAllegati } from './scarica';
import type { Recuperatore } from './scarica';
import { ritaglia } from './ritaglio';
import { estraiTestoPdf } from './pdf';
import { estraiRegole, type ClienteModello } from './estrattore';
import { salvaRegole } from './persistenza';

// Catena del valore, dal sito: dato un corso, scarica la sua pagina della prova
// finale (con allegati), la ritaglia, estrae le REGOLE come proposte e le salva.
// È il ponte che mancava fra ricognizione (scopri) e revisione (conferma):
// prima scarica ed estrai erano solo da riga di comando. [compiti ②③④ dal web]
//
// Le scadenze (calendario) sono per DIPARTIMENTO e arrivano in un secondo passo:
// richiedono di legare il corso a un dipartimento e alla pagina del calendario.

export interface EsitoElaborazione {
  documentiScaricati: number;
  regoleTrovate: number;
  regoleInserite: number;
  scartate: number;
  esito: string;
}

export async function elaboraRegoleCorso(
  corsoId: number,
  opzioni: { cliente: ClienteModello; recupera?: Recuperatore }
): Promise<EsitoElaborazione> {
  const c = await query<{ url_prova_finale: string | null }>(
    'select url_prova_finale from corso where id = $1',
    [corsoId]
  );
  if (c.rows.length === 0) throw new Error(`Corso #${corsoId} inesistente.`);
  const url = c.rows[0].url_prova_finale;
  if (!url) throw new Error('Il corso non ha una URL della prova finale da elaborare.');

  // ② scarica la pagina + eventuali allegati (grezzo + hash, catena).
  const scaricato = await scaricaConAllegati(url, { recupera: opzioni.recupera });

  // ③ ricava il testo dalla pagina: ritaglio se HTML, testo se PDF.
  const doc = await query<{ tipo: string; contenuto_grezzo: Buffer }>(
    'select tipo, contenuto_grezzo from documento where id = $1',
    [scaricato.paginaId]
  );
  const corpo = Buffer.from(doc.rows[0].contenuto_grezzo);
  const testo =
    doc.rows[0].tipo === 'pdf'
      ? await estraiTestoPdf(corpo)
      : ritaglia(corpo.toString('utf8')).testo;

  // ④ estrai le regole (proposte, con fonte ancorata) e salvale.
  const est = await estraiRegole(testo, url, opzioni.cliente);
  const salvato = await salvaRegole(corsoId, scaricato.paginaId, est);

  return {
    documentiScaricati: 1 + scaricato.allegati.length,
    regoleTrovate: est.regole.length,
    regoleInserite: salvato.regoleInserite,
    scartate: est.scartate,
    esito: est.esito,
  };
}
