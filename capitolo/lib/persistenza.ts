import { pool } from './db';
import type { EsitoCalendario, EsitoRegole } from './estrattore';

// Salvataggio delle proposte prodotte dall'estrattore (compito ④).
//
// Ogni scadenza e ogni regola nasce con stato 'proposta' (default di schema):
// niente diventa pubblico finché una persona non conferma. [inv. 4]
// Registriamo anche una riga in `estrazione` con modello, versione del prompt,
// costo ed esito, così la qualità è confrontabile nel tempo.

export async function registraEstrazione(params: {
  documentoId: number;
  modello: string;
  promptVersione: string;
  costo: number | null;
  esito: string;
}): Promise<number> {
  const res = await pool().query<{ id: string }>(
    `insert into estrazione (documento_id, modello, prompt_versione, costo, esito)
     values ($1, $2, $3, $4, $5) returning id`,
    [params.documentoId, params.modello, params.promptVersione, params.costo, params.esito]
  );
  return Number(res.rows[0].id);
}

// Salva sessioni + scadenze proposte per un dipartimento. Ritorna quante
// scadenze sono state inserite. Tutto in una transazione.
export async function salvaCalendario(
  dipartimentoId: number,
  documentoId: number,
  esito: EsitoCalendario
): Promise<{ estrazioneId: number; scadenzeInserite: number }> {
  const client = await pool().connect();
  try {
    await client.query('begin');
    const est = await client.query<{ id: string }>(
      `insert into estrazione (documento_id, modello, prompt_versione, costo, esito)
       values ($1, $2, $3, $4, $5) returning id`,
      [documentoId, esito.modello, esito.promptVersione, esito.costo, esito.esito]
    );
    const estrazioneId = Number(est.rows[0].id);

    let scadenzeInserite = 0;
    for (const s of esito.sessioni) {
      const ses = await client.query<{ id: string }>(
        `insert into sessione (dipartimento_id, nome, anno_accademico, seduta_da, seduta_a)
         values ($1, $2, $3, $4, $5) returning id`,
        [dipartimentoId, s.nome, s.anno_accademico, s.seduta_da, s.seduta_a]
      );
      const sessioneId = Number(ses.rows[0].id);
      for (const sc of s.scadenze) {
        await client.query(
          `insert into scadenza
             (sessione_id, tipo, nome, data_da, data_a, blocca,
              fonte_url, fonte_citazione, confidenza, documento_id)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [sessioneId, sc.tipo, sc.nome, sc.data_da, sc.data_a, sc.blocca,
           sc.fonte_url, sc.fonte_citazione, sc.confidenza, documentoId]
        );
        scadenzeInserite += 1;
      }
    }
    await client.query('commit');
    return { estrazioneId, scadenzeInserite };
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

// Salva le regole proposte per un corso. Ritorna quante regole inserite.
export async function salvaRegole(
  corsoId: number,
  documentoId: number,
  esito: EsitoRegole
): Promise<{ estrazioneId: number; regoleInserite: number }> {
  const client = await pool().connect();
  try {
    await client.query('begin');
    const est = await client.query<{ id: string }>(
      `insert into estrazione (documento_id, modello, prompt_versione, costo, esito)
       values ($1, $2, $3, $4, $5) returning id`,
      [documentoId, esito.modello, esito.promptVersione, esito.costo, esito.esito]
    );
    const estrazioneId = Number(est.rows[0].id);

    let regoleInserite = 0;
    for (const r of esito.regole) {
      await client.query(
        `insert into regola
           (corso_id, classe, tipo, testo, valore, vincolante,
            fonte_url, fonte_citazione, confidenza, documento_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [corsoId, r.classe, r.tipo, r.testo,
         r.valore === null ? null : JSON.stringify(r.valore),
         r.vincolante, r.fonte_url, r.fonte_citazione, r.confidenza, documentoId]
      );
      regoleInserite += 1;
    }
    await client.query('commit');
    return { estrazioneId, regoleInserite };
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}
