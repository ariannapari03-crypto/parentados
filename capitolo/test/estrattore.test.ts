import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ritaglia } from '../lib/ritaglio.js';
import { estraiTestoPdf } from '../lib/pdf.js';
import {
  citazioneAncorata,
  estraiCalendario,
  estraiRegole,
  type ClienteModello,
} from '../lib/estrattore.js';
import { salvaCalendario } from '../lib/persistenza.js';
import { query, chiudi } from '../lib/db.js';

// Compito ④: estrazione. Nessuna chiamata al modello reale: iniettiamo un
// ClienteModello finto che restituisce risposte REGISTRATE (fixture .json),
// costruite in modo che ogni citazione sia una sottostringa del testo di
// partenza. Così si verifica la logica di estrazione e i suoi guard-rail.

const qui = dirname(fileURLToPath(import.meta.url));
const fx = (n: string) => join(qui, 'fixtures', n);
const leggi = (n: string) => readFileSync(fx(n), 'utf8');

// Cliente finto: ignora il prompt e restituisce sempre `testo`.
function clienteRegistrato(testo: string): ClienteModello {
  return {
    async completa() {
      return { testo, modello: 'registrato', costo: 0 };
    },
  };
}

const RE_DATA_ISO = /\b\d{4}-\d{2}-\d{2}\b/;

afterAll(async () => {
  await chiudi();
});

describe('estrazione calendario', () => {
  it('Scienze storiche: ritrova tutte e 30 le date su due anni accademici', async () => {
    const testo = ritaglia(leggi('unibo_scienze_storiche_scadenze.html')).testo;
    const cliente = clienteRegistrato(leggi('risposta_calendario_scienze_storiche.json'));
    const fonteUrl = 'https://corsi.unibo.it/.../ScienzeStoriche/scadenze';

    const esito = await estraiCalendario(testo, fonteUrl, cliente);

    expect(esito.esito).toBe('riuscita');
    expect(esito.scartate).toBe(0);
    const tutte = esito.sessioni.flatMap((s) => s.scadenze);
    expect(tutte).toHaveLength(30);
    // Due anni accademici distinti.
    expect(new Set(esito.sessioni.map((s) => s.anno_accademico))).toEqual(
      new Set(['2023/2024', '2024/2025'])
    );
    // Ogni scadenza: data ISO, fonte ancorata, url attaccato. [inv. 1, 2]
    for (const sc of tutte) {
      expect(sc.data_da).toMatch(RE_DATA_ISO);
      expect(sc.fonte_url).toBe(fonteUrl);
      expect(testo).toContain(sc.fonte_citazione);
    }
    // Le 30 date ISO sono tutte distinte.
    expect(new Set(tutte.map((s) => s.data_da)).size).toBe(30);
  });

  it('PAO: nessuna data nell’HTML, le trova nel PDF allegato', async () => {
    const testoPdf = await estraiTestoPdf(readFileSync(fx('calendario_pao_sps.pdf')));
    const cliente = clienteRegistrato(leggi('risposta_calendario_pao_pdf.json'));

    const esito = await estraiCalendario(testoPdf, 'https://corsi.unibo.it/.../SPS.pdf', cliente);

    expect(esito.esito).toBe('riuscita');
    const tutte = esito.sessioni.flatMap((s) => s.scadenze);
    expect(tutte).toHaveLength(9);
    expect(tutte.every((s) => s.data_da && testoPdf.includes(s.fonte_citazione))).toBe(true);
  });
});

describe('guard-rail: mai inventare, mai senza fonte', () => {
  const testo = ritaglia(leggi('unibo_scienze_storiche_scadenze.html')).testo;

  it('scarta una scadenza la cui citazione non è nel testo [inv. 2]', async () => {
    const cliente = clienteRegistrato(
      JSON.stringify({
        sessioni: [{
          nome: 'Estiva', anno_accademico: '2023/2024',
          scadenze: [{ tipo: 'domanda_laurea', data_da: '2024-06-10',
            fonte_citazione: 'Frase che NON compare da nessuna parte nel documento.' }],
        }],
      })
    );
    const esito = await estraiCalendario(testo, 'https://x', cliente);
    expect(esito.esito).toBe('fallita'); // nessuna scadenza valida
    expect(esito.scartate).toBe(1);
    expect(esito.sessioni).toHaveLength(0);
  });

  it('scarta una data non scritta nel testo, anche con citazione valida [inv. 1]', async () => {
    // Citazione reale (una riga della tabella) ma data inventata, assente nel testo.
    const cliente = clienteRegistrato(
      JSON.stringify({
        sessioni: [{
          nome: 'Estiva', anno_accademico: '2023/2024',
          scadenze: [{ tipo: 'domanda_laurea', data_da: '2024-06-30',
            fonte_citazione: 'Estiva | 10/06/2024 | 24/06/2024 | 15/07/2024' }],
        }],
      })
    );
    const esito = await estraiCalendario(testo, 'https://x', cliente);
    expect(esito.scartate).toBe(1);
    expect(esito.sessioni).toHaveLength(0);
  });

  it('ammette una scadenza senza data (lacuna) purché con fonte [inv. 1]', async () => {
    const cliente = clienteRegistrato(
      JSON.stringify({
        sessioni: [{
          nome: 'Estiva', anno_accademico: '2023/2024',
          scadenze: [{ tipo: 'domanda_laurea', data_da: null,
            fonte_citazione: 'Estiva | 10/06/2024 | 24/06/2024 | 15/07/2024' }],
        }],
      })
    );
    const esito = await estraiCalendario(testo, 'https://x', cliente);
    expect(esito.esito).toBe('riuscita');
    expect(esito.sessioni[0].scadenze[0].data_da).toBeNull();
  });
});

describe('estrazione regole', () => {
  it('la lunghezza «orientativa» resta non vincolante; il formato obbligatorio sì [inv. 9]', async () => {
    const testo = ritaglia(leggi('unibo_scienze_storiche_regole.html')).testo;
    const cliente = clienteRegistrato(leggi('risposta_regole.json'));

    const esito = await estraiRegole(testo, 'https://corsi.unibo.it/.../modalita', cliente);

    expect(esito.esito).toBe('riuscita');
    expect(esito.regole).toHaveLength(2);
    const lunghezza = esito.regole.find((r) => r.tipo === 'lunghezza')!;
    const formato = esito.regole.find((r) => r.tipo === 'formato')!;
    expect(lunghezza.vincolante).toBe(false);
    expect(formato.vincolante).toBe(true);
    for (const r of esito.regole) expect(citazioneAncorata(r.fonte_citazione, testo)).toBe(true);
  });
});

describe('persistenza: le proposte nascono confermabili, non pubbliche', () => {
  it("salva scadenze con stato 'proposta' e registra l'estrazione [inv. 4]", async () => {
    const at = await query<{ id: string }>(
      "insert into ateneo (nome) values ('Ateneo estrazione') returning id"
    );
    const ateneoId = Number(at.rows[0].id);
    try {
      const dip = await query<{ id: string }>(
        'insert into dipartimento (ateneo_id, nome) values ($1, $2) returning id',
        [ateneoId, 'Dip. Storia']
      );
      const doc = await query<{ id: string }>(
        `insert into documento (url, tipo, contenuto_grezzo, hash)
         values ('https://x/doc', 'html', $1, 'h') returning id`,
        [Buffer.from('<html></html>')]
      );
      const dipartimentoId = Number(dip.rows[0].id);
      const documentoId = Number(doc.rows[0].id);

      const esito = {
        sessioni: [{
          nome: 'Estiva', anno_accademico: '2024/2025', seduta_da: '2025-07-14', seduta_a: null,
          scadenze: [{
            tipo: 'domanda_laurea', nome: 'Domanda', data_da: '2025-06-09', data_a: null,
            blocca: true, fonte_url: 'https://x/doc',
            fonte_citazione: 'domanda 09/06/2025', confidenza: 0.9,
          }],
        }],
        esito: 'riuscita' as const, scartate: 0,
        modello: 'registrato', promptVersione: 'calendario/1', costo: 0,
      };

      const { estrazioneId, scadenzeInserite } = await salvaCalendario(dipartimentoId, documentoId, esito);
      expect(scadenzeInserite).toBe(1);

      const sca = await query<{ stato: string; fonte_citazione: string; documento_id: string }>(
        `select sc.stato, sc.fonte_citazione, sc.documento_id
         from scadenza sc join sessione s on s.id = sc.sessione_id
         where s.dipartimento_id = $1`,
        [dipartimentoId]
      );
      expect(sca.rows).toHaveLength(1);
      expect(sca.rows[0].stato).toBe('proposta'); // niente esce pubblico
      expect(sca.rows[0].fonte_citazione).toBe('domanda 09/06/2025');
      expect(Number(sca.rows[0].documento_id)).toBe(documentoId);

      const est = await query<{ prompt_versione: string; esito: string }>(
        'select prompt_versione, esito from estrazione where id = $1',
        [estrazioneId]
      );
      expect(est.rows[0].prompt_versione).toBe('calendario/1');
      expect(est.rows[0].esito).toBe('riuscita');
    } finally {
      await query('delete from ateneo where id = $1', [ateneoId]);
      await query("delete from documento where url = 'https://x/doc'");
    }
  });
});
