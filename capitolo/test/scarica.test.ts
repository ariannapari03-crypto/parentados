import 'dotenv/config';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { estraiAllegati, scaricaConAllegati } from '../lib/scarica';
import { query, chiudi } from '../lib/db';

// Compito ②: scaricamento con allegati.
//
// Nessun test chiama i siti degli atenei: l'estrazione lavora su una fixture
// salvata, e lo scaricamento vero gira contro un server HTTP locale che serve
// le stesse fixture. [convenzione: test su pagine reali salvate in fixtures]

const qui = dirname(fileURLToPath(import.meta.url));
const HTML_PAO = readFileSync(
  join(qui, 'fixtures', 'unibo_pao_requisiti_e_scadenze.html')
);
const PDF_SPS = readFileSync(join(qui, 'fixtures', 'calendario_sps_bologna.pdf'));

const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex');

afterAll(async () => {
  await chiudi();
});

describe('estrazione degli allegati', () => {
  const base =
    'https://corsi.unibo.it/magistrale/PoliticaAmministrazioneOrganizzazione/prova-finale-laurea-magistrale-requisiti-e-scadenze';

  it('trova il PDF del calendario nel riquadro «In evidenza» [inv. 5]', () => {
    const allegati = estraiAllegati(HTML_PAO.toString('utf8'), base);
    expect(allegati).toHaveLength(1);
    expect(allegati[0]).toContain('/@@download/');
    expect(allegati[0].toLowerCase()).toContain('calendario');
    // URL assoluto, risolto rispetto alla pagina
    expect(allegati[0]).toMatch(/^https:\/\/corsi\.unibo\.it\//);
  });

  it('ignora navigazione, mailto e link interni non-PDF', () => {
    const allegati = estraiAllegati(HTML_PAO.toString('utf8'), base);
    expect(allegati.some((u) => u.includes('mailto:'))).toBe(false);
    expect(allegati.some((u) => u.includes('unibo.it/it'))).toBe(false);
    expect(allegati.some((u) => u.endsWith('/studiare'))).toBe(false);
  });
});

// Server locale che imita corsi.unibo.it: HTML sulla pagina, PDF sul percorso
// di download di Plone.
function avviaServer(): Promise<{ server: Server; base: string }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = decodeURIComponent(req.url ?? '');
      if (url.includes('/@@download/')) {
        res.writeHead(200, { 'content-type': 'application/pdf' });
        res.end(PDF_SPS);
      } else if (url.endsWith('requisiti-e-scadenze')) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(HTML_PAO);
      } else {
        res.writeHead(404);
        res.end('non trovato');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const dir = server.address();
      const porta = typeof dir === 'object' && dir ? dir.port : 0;
      resolve({ server, base: `http://127.0.0.1:${porta}` });
    });
  });
}

describe('scaricaConAllegati contro server locale', () => {
  it('segue il PDF, salva pagina e allegato con grezzo + hash e catena [inv. 5, 6]', async () => {
    const { server, base } = await avviaServer();
    const urlPagina = `${base}/magistrale/PoliticaAmministrazioneOrganizzazione/prova-finale-laurea-magistrale-requisiti-e-scadenze`;
    const idDaRipulire: number[] = [];
    try {
      const esito = await scaricaConAllegati(urlPagina);
      idDaRipulire.push(esito.paginaId, ...esito.allegati.map((a) => a.documentoId));

      // La pagina non ha date nel testo: l'unico modo per avere il calendario è
      // seguire il PDF. Deve essere stato scaricato.
      expect(esito.allegati).toHaveLength(1);

      const pagina = await query<{ tipo: string; hash: string; origine_id: string | null }>(
        'select tipo, hash, origine_id from documento where id = $1',
        [esito.paginaId]
      );
      expect(pagina.rows[0].tipo).toBe('html');
      expect(pagina.rows[0].hash).toBe(sha256(HTML_PAO));
      expect(pagina.rows[0].origine_id).toBeNull();

      const pdfId = esito.allegati[0].documentoId;
      const pdf = await query<{
        tipo: string;
        hash: string;
        origine_id: string | null;
        contenuto_grezzo: Buffer;
      }>(
        'select tipo, hash, origine_id, contenuto_grezzo from documento where id = $1',
        [pdfId]
      );
      expect(pdf.rows[0].tipo).toBe('pdf');
      expect(pdf.rows[0].hash).toBe(sha256(PDF_SPS));
      // catena pagina → allegato
      expect(Number(pdf.rows[0].origine_id)).toBe(esito.paginaId);
      // grezzo integrale conservato, byte per byte
      expect(Buffer.from(pdf.rows[0].contenuto_grezzo).equals(PDF_SPS)).toBe(true);
    } finally {
      if (idDaRipulire.length > 0) {
        await query('delete from documento where id = any($1::bigint[])', [idDaRipulire]);
      }
      server.close();
    }
  });

  it('ri-scaricare è idempotente: stesso url + stesso hash, nessun doppione [inv. 6]', async () => {
    const { server, base } = await avviaServer();
    const urlPagina = `${base}/magistrale/PoliticaAmministrazioneOrganizzazione/prova-finale-laurea-magistrale-requisiti-e-scadenze`;
    const idDaRipulire = new Set<number>();
    try {
      const primo = await scaricaConAllegati(urlPagina);
      const secondo = await scaricaConAllegati(urlPagina);
      [primo, secondo].forEach((e) => {
        idDaRipulire.add(e.paginaId);
        e.allegati.forEach((a) => idDaRipulire.add(a.documentoId));
      });
      // Gli id del secondo giro coincidono con quelli del primo: niente doppioni.
      expect(secondo.paginaId).toBe(primo.paginaId);
      expect(secondo.allegati[0].documentoId).toBe(primo.allegati[0].documentoId);

      const conteggio = await query<{ n: string }>(
        'select count(*)::text as n from documento where id = any($1::bigint[])',
        [[...idDaRipulire]]
      );
      expect(Number(conteggio.rows[0].n)).toBe(2); // solo pagina + PDF
    } finally {
      if (idDaRipulire.size > 0) {
        await query('delete from documento where id = any($1::bigint[])', [[...idDaRipulire]]);
      }
      server.close();
    }
  });
});
