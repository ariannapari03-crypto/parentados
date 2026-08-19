import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ritaglia } from '../lib/ritaglio.js';

// Compito ③: ritaglio.
//
// Criterio di completamento: su tre pagine di atenei diversi il testo ritagliato
// è sotto il 15% dell'originale e non perde nessuna tabella di scadenze.
// Le tre pagine sono i casi reali indicati dal brief: UniBo Scienze storiche
// (due tabelle nell'HTML), UniBo Politica e amministrazione (nessuna tabella:
// le date sono nel PDF) e UniTO Lingue (calendario molto rumoroso).

const qui = dirname(fileURLToPath(import.meta.url));
const leggi = (nome: string) =>
  readFileSync(join(qui, 'fixtures', nome), 'utf8');

const RE_DATA = /\b\d{2}\/\d{2}\/\d{4}\b/g;

// Frammenti di rumore che NON devono sopravvivere al ritaglio.
const RUMORE = [
  'Accetta tutti',
  'Impostazioni cookie',
  'Preferenze cookie',
  'Partita IVA',
  'P.I.',
  'Facebook',
  'Instagram',
  'English',
  'dataLayer',
  'gtag',
];

function nessunRumore(testo: string, rumori: string[]) {
  for (const r of rumori) {
    expect(testo, `il ritaglio non deve contenere «${r}»`).not.toContain(r);
  }
}

describe('ritaglio sotto il 15% su tre atenei', () => {
  it('UniBo · Scienze storiche — due tabelle, 30 date preservate', () => {
    const html = leggi('unibo_scienze_storiche_scadenze.html');
    const esito = ritaglia(html);

    expect(esito.frazione).toBeLessThan(0.15);
    expect(esito.tabelle).toBe(2);

    // Nessuna tabella persa: tutte e 30 le date sopravvivono.
    const date = esito.testo.match(RE_DATA) ?? [];
    expect(date).toHaveLength(30);
    // Alcune ancore concrete, una per anno accademico.
    expect(esito.testo).toContain('10/06/2024');
    expect(esito.testo).toContain('07/04/2026');
    // Le celle non si fondono: la resa mantiene i separatori.
    expect(esito.testo).toContain('Estiva | 10/06/2024 | 24/06/2024 | 15/07/2024');

    nessunRumore(esito.testo, RUMORE);
  });

  it('UniTO · Lingue — calendario rumoroso, tabella preservata', () => {
    const html = leggi('unito_lingue_calendario.html');
    const esito = ritaglia(html);

    expect(esito.frazione).toBeLessThan(0.15);
    expect(esito.tabelle).toBe(1);

    const date = esito.testo.match(RE_DATA) ?? [];
    expect(date).toHaveLength(12); // 4 sessioni × 3 date
    expect(esito.testo).toContain('05/06/2025');
    expect(esito.testo).toContain('12/02/2026');

    nessunRumore(esito.testo, RUMORE);
  });

  it('UniBo · Politica e amministrazione — nessuna tabella, resta poco testo', () => {
    const html = leggi('unibo_pao_requisiti_e_scadenze.html');
    const esito = ritaglia(html);

    expect(esito.frazione).toBeLessThan(0.15);
    expect(esito.tabelle).toBe(0); // le date sono nel PDF, non nell'HTML
    // Il corpo utile sopravvive...
    expect(esito.testo).toContain('domanda di laurea');
    // ...ma la navigazione e i contatti di servizio no.
    nessunRumore(esito.testo, ['Home corso', 'Scrivi alla segreteria', 'Privacy e note legali']);
  });

  it('conserva il grezzo: il ritaglio non altera l’input', () => {
    const html = leggi('unito_lingue_calendario.html');
    const copia = String(html);
    ritaglia(html);
    expect(html).toBe(copia);
  });
});
