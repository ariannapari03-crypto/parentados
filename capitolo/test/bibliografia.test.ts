import { describe, expect, it } from 'vitest';
import {
  rifDaCrossref,
  formattaAutori,
  citazioneBreve,
  linkFonte,
  urlRicercaCrossref,
  urlDaDoi,
  fontiDiPartenza,
  type Riferimento,
  type VoceCrossref,
} from '../lib/bibliografia';
import { sezioniPiatte, type Sezione } from '../lib/impianto';

// Fase 2 — bibliografia. Funzioni pure: niente rete, niente DB. Lo scout non
// inventa: mappa solo ciò che il catalogo restituisce.

function rif(over: Partial<Riferimento>): Riferimento {
  return { id: '1', titolo: 'T', autori: 'A', anno: '2020', letta: false, capitoloId: null, ...over };
}

describe('autori', () => {
  it('iniziali dai nomi propri, «Cognome, I.»', () => {
    expect(formattaAutori([{ given: 'Mario', family: 'Rossi' }])).toBe('Rossi, M.');
    expect(formattaAutori([{ given: 'Jean-Charles', family: 'Rochet' }])).toBe('Rochet, J. C.');
  });
  it('fino a 3 con &, oltre «et al.»', () => {
    const a = [{ family: 'A' }, { family: 'B' }, { family: 'C' }, { family: 'D' }];
    expect(formattaAutori(a)).toBe('A et al.');
    expect(formattaAutori(a.slice(0, 2))).toBe('A & B');
  });
  it('vuoto → trattino', () => {
    expect(formattaAutori([])).toBe('—');
    expect(formattaAutori(undefined)).toBe('—');
  });
});

describe('rifDaCrossref — mai inventa', () => {
  const v: VoceCrossref = {
    DOI: '10.1509/jmkr.48.1.172',
    title: ['How Should Consumers’ Willingness to Pay Be Measured?'],
    author: [{ given: 'Klaus M.', family: 'Miller' }, { given: 'Reto', family: 'Hofstetter' }],
    issued: { 'date-parts': [[2011, 2, 1]] },
    'container-title': ['Journal of Marketing Research'],
    type: 'journal-article',
  };
  it('mappa i campi presenti', () => {
    const r = rifDaCrossref(v);
    expect(r.doi).toBe('10.1509/jmkr.48.1.172');
    expect(r.anno).toBe('2011');
    expect(r.rivista).toBe('Journal of Marketing Research');
    expect(r.autori).toBe('Miller, K. M. & Hofstetter, R.');
    expect(r.tipo).toBe('articolo');
  });
  it('campi mancanti restano vuoti, non inventati', () => {
    const r = rifDaCrossref({ title: ['Solo titolo'] });
    expect(r.anno).toBe('');
    expect(r.doi).toBeUndefined();
    expect(r.autori).toBe('—');
  });
});

describe('citazione e link', () => {
  it('citazione breve leggibile', () => {
    const c = citazioneBreve(rif({ autori: 'Rossi, M.', anno: '2020', titolo: 'Titolo', rivista: 'Rivista' }));
    expect(c).toBe('Rossi, M. (2020). Titolo. Rivista.');
  });
  it('il link preferisce il DOI', () => {
    expect(linkFonte(rif({ doi: '10.x/y' }))).toBe('https://doi.org/10.x/y');
    expect(linkFonte(rif({ url: 'https://z' }))).toBe('https://z');
    expect(linkFonte(rif({}))).toBeNull();
  });
});

describe('url dello scout', () => {
  it('cerca su Crossref con query codificata', () => {
    const u = urlRicercaCrossref('two-sided markets');
    expect(u).toContain('api.crossref.org/works');
    expect(u).toContain('query=two-sided%20markets');
  });
  it('normalizza il DOI (toglie il prefisso doi.org)', () => {
    expect(urlDaDoi('https://doi.org/10.1/abc')).toContain('/works/10.1%2Fabc');
    expect(urlDaDoi('10.1/abc')).toContain('/works/10.1%2Fabc');
  });
});

describe('fonti di partenza', () => {
  it('sono proposte da leggere (letta:false) e verificate hanno il DOI', () => {
    const f = fontiDiPartenza();
    expect(f.length).toBeGreaterThan(10);
    expect(f.every((x) => x.letta === false)).toBe(true);
    const miller = f.find((x) => x.autori.startsWith('Miller'));
    expect(miller?.doi).toBe('10.1509/jmkr.48.1.172');
  });
});

describe('legame con i capitoli', () => {
  function s(id: string, titolo: string, figli: Sezione[] = []): Sezione {
    return { id, titolo, stato: 'vuota', figli, pagineDa: null, pagineA: null };
  }
  it('appiattisce l’indice con la numerazione decimale', () => {
    const piatte = sezioniPiatte([s('a', 'Intro'), s('b', 'Corpo', [s('b1', 'Sotto')])]);
    expect(piatte).toEqual([
      { id: 'a', numero: '1', titolo: 'Intro' },
      { id: 'b', numero: '2', titolo: 'Corpo' },
      { id: 'b1', numero: '2.1', titolo: 'Sotto' },
    ]);
  });
});
