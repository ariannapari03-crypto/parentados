import 'dotenv/config';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { query, chiudi } from '../lib/db';
import { elaboraRegoleCorso } from '../lib/pipeline';
import type { ClienteModello } from '../lib/estrattore';

// Fase 2 / catena dal sito: elaboraRegoleCorso scarica la pagina del corso, la
// ritaglia, estrae le regole e le salva come proposte. Nessuna chiamata al
// modello reale (cliente registrato) né agli atenei (server HTTP locale).

const qui = dirname(fileURLToPath(import.meta.url));
const HTML_REGOLE = readFileSync(join(qui, 'fixtures', 'unibo_scienze_storiche_regole.html'), 'utf8');
const RISPOSTA = readFileSync(join(qui, 'fixtures', 'risposta_regole.json'), 'utf8');

const clienteRegistrato: ClienteModello = {
  async completa() {
    return { testo: RISPOSTA, modello: 'registrato', costo: 0 };
  },
};

function avviaServer(): Promise<{ server: Server; base: string }> {
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(HTML_REGOLE);
    });
    server.listen(0, '127.0.0.1', () => {
      const dir = server.address();
      const porta = typeof dir === 'object' && dir ? dir.port : 0;
      resolve({ server, base: `http://127.0.0.1:${porta}/corso` });
    });
  });
}

afterAll(async () => {
  await chiudi();
});

describe('elaboraRegoleCorso — catena scarica→ritaglia→estrai→salva', () => {
  it('scarica la pagina ed estrae le regole come proposte', async () => {
    const { server, base } = await avviaServer();
    const at = await query<{ id: string }>("insert into ateneo (nome) values ('Ateneo pipe') returning id");
    const ateneoId = Number(at.rows[0].id);
    try {
      const co = await query<{ id: string }>(
        'insert into corso (ateneo_id, nome, url_prova_finale) values ($1,$2,$3) returning id',
        [ateneoId, 'Corso pipe', base]
      );
      const corsoId = Number(co.rows[0].id);

      const esito = await elaboraRegoleCorso(corsoId, { cliente: clienteRegistrato });

      expect(esito.documentiScaricati).toBe(1); // pagina, nessun allegato
      expect(esito.regoleInserite).toBe(2); // le due regole della fixture
      expect(esito.esito).toBe('riuscita');

      const reg = await query<{ stato: string; fonte_url: string }>(
        'select stato, fonte_url from regola where corso_id = $1',
        [corsoId]
      );
      expect(reg.rows).toHaveLength(2);
      // nascono come proposte, con la fonte
      expect(reg.rows.every((r) => r.stato === 'proposta')).toBe(true);
      expect(reg.rows.every((r) => r.fonte_url === base)).toBe(true);
    } finally {
      await query('delete from ateneo where id=$1', [ateneoId]);
      await query('delete from documento where url like $1', [`${base}%`]);
      server.close();
    }
  });
});
