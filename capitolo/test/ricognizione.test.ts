import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { query, chiudi } from '../lib/db';
import {
  scopriCorsi, scegliCatalogo, ricognizioneAteneo,
  type RisultatoRicerca,
} from '../lib/ricognizione';
import type { Recuperatore } from '../lib/scarica';

// Compito ⑦: ricognizione. Dato un ateneo scritto in un campo di testo, viene
// cercato sul momento e i suoi corsi enumerati dai link reali della pagina.
// Qui search e fetch sono iniettati: nessuna chiamata a servizi esterni.

const qui = dirname(fileURLToPath(import.meta.url));
const CATALOGO = readFileSync(join(qui, 'fixtures', 'catalogo_corsi_generico.html'), 'utf8');
const BASE = 'https://www.ateneodiprova.it/corsi';

// Recuperatore finto: restituisce sempre il catalogo di prova.
const recuperaFinto: Recuperatore = async (url) => ({
  corpo: Buffer.from(CATALOGO, 'utf8'),
  contentType: 'text/html',
  urlFinale: url,
});

afterAll(async () => {
  await chiudi();
});

describe('estrazione dei corsi dal catalogo', () => {
  it('trova i 6 corsi e ignora la navigazione e l’indice', () => {
    const corsi = scopriCorsi(CATALOGO, BASE);
    expect(corsi).toHaveLength(6);
    const nomi = corsi.map((c) => c.nome);
    expect(nomi).toContain('Informatica');
    expect(nomi).toContain('Scienze storiche e orientalistiche');
    // niente voci di menu o link di servizio
    expect(nomi).not.toContain('Servizi');
    expect(nomi).not.toContain('Contatti');
    expect(corsi.some((c) => c.url.endsWith('/corsi'))).toBe(false); // non l'indice
    // URL assoluti
    for (const c of corsi) expect(c.url).toMatch(/^https:\/\/www\.ateneodiprova\.it\/corsi\//);
  });

  it('sceglie un URL di catalogo plausibile dai risultati di ricerca', () => {
    const risultati: RisultatoRicerca[] = [
      { titolo: 'Home', url: 'https://www.ateneodiprova.it/' },
      { titolo: 'Corsi di laurea', url: 'https://www.ateneodiprova.it/corsi' },
    ];
    expect(scegliCatalogo(risultati)).toBe('https://www.ateneodiprova.it/corsi');
    expect(scegliCatalogo([])).toBeNull();
  });
});

describe('ricognizione end-to-end (search e fetch iniettati)', () => {
  it('cerca l’ateneo, salva i corsi scoperti (da verificare) ed è idempotente', async () => {
    const cerca = async (): Promise<RisultatoRicerca[]> => [
      { titolo: 'Corsi di laurea — Ateneo di prova', url: BASE },
    ];
    const nomeAteneo = `Ateneo di prova ${Date.now()}`; // unico per non collidere
    try {
      const esito = await ricognizioneAteneo(nomeAteneo, { cerca, recupera: recuperaFinto });
      expect(esito.scoperti).toHaveLength(6);
      expect(esito.nuovi).toBe(6);
      expect(esito.catalogoUrl).toBe(BASE);

      // I corsi sono in database, con URL e senza verifica umana.
      const inDb = await query<{ nome: string; url_prova_finale: string; verificato_il: string | null }>(
        `select c.nome, c.url_prova_finale, a.verificato_il
           from corso c join ateneo a on a.id = c.ateneo_id
          where c.ateneo_id = $1 order by c.nome`,
        [esito.ateneoId]
      );
      expect(inDb.rows).toHaveLength(6);
      expect(inDb.rows.every((r) => r.url_prova_finale.startsWith('https://'))).toBe(true);
      expect(inDb.rows.every((r) => r.verificato_il === null)).toBe(true); // da verificare

      // Ri-eseguire non duplica.
      const secondo = await ricognizioneAteneo(nomeAteneo, { cerca, recupera: recuperaFinto });
      expect(secondo.nuovi).toBe(0);
      const conteggio = await query<{ n: string }>(
        'select count(*)::text n from corso where ateneo_id = $1',
        [esito.ateneoId]
      );
      expect(Number(conteggio.rows[0].n)).toBe(6);
    } finally {
      await query("delete from ateneo where nome like 'Ateneo di prova %'");
    }
  });

  it('se la ricerca non trova nulla, crea l’ateneo ma nessun corso', async () => {
    const cerca = async (): Promise<RisultatoRicerca[]> => [];
    const nomeAteneo = `Ateneo vuoto ${Date.now()}`;
    try {
      const esito = await ricognizioneAteneo(nomeAteneo, { cerca, recupera: recuperaFinto });
      expect(esito.catalogoUrl).toBeNull();
      expect(esito.scoperti).toHaveLength(0);
      expect(esito.nuovi).toBe(0);
    } finally {
      await query("delete from ateneo where nome like 'Ateneo vuoto %'");
    }
  });
});
