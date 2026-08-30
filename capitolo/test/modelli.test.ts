import { describe, expect, it } from 'vitest';
import { estraiStruttura, classificaRuolo, profiloComune } from '../lib/modelli';

// Fase 2 — i modelli. Funzione pura sul testo dell'indice: estrae struttura,
// mai contenuto. Niente PDF, niente rete.

const INDICE = `
Frontespizio
Indice
Abstract .......................................... 1
1  Introduzione ................................... 3
2  Rassegna della letteratura ..................... 9
2.1  Piattaforme a due lati ....................... 10
2.2  Valore percepito ............................. 15
3  Metodologia .................................... 21
4  Risultati ...................................... 30
5  Discussione .................................... 41
6  Conclusioni .................................... 47
Bibliografia ...................................... 50
`;

describe('classificaRuolo', () => {
  it('riconosce i ruoli in italiano e inglese', () => {
    expect(classificaRuolo('Introduction')).toBe('introduzione');
    expect(classificaRuolo('Rassegna della letteratura')).toBe('letteratura');
    expect(classificaRuolo('Materiali e metodi')).toBe('metodo');
    expect(classificaRuolo('Results and findings')).toBe('risultati');
    expect(classificaRuolo('Conclusioni')).toBe('conclusioni');
    expect(classificaRuolo('Bibliografia')).toBe('bibliografia');
    expect(classificaRuolo('Un titolo qualsiasi')).toBe('altro');
  });
});

describe('estraiStruttura — solo ossatura', () => {
  const p = estraiStruttura(INDICE);
  it('estrae le voci dell’indice con pagina e livello', () => {
    const titoli = p.sezioni.map((s) => s.titolo);
    expect(titoli).toContain('Introduzione');
    expect(titoli).toContain('Piattaforme a due lati');
    const intro = p.sezioni.find((s) => s.titolo === 'Introduzione');
    expect(intro?.pagina).toBe(3);
    expect(intro?.livello).toBe(1);
    const sub = p.sezioni.find((s) => s.titolo === 'Piattaforme a due lati');
    expect(sub?.livello).toBe(2);
  });
  it('calcola il peso in pagine fino alla sezione successiva', () => {
    const metodo = p.sezioni.find((s) => s.ruolo === 'metodo');
    // Metodologia a p.21, Risultati a p.30 → 9 pagine
    expect(metodo?.pagine).toBe(9);
  });
  it('deduce le pagine totali dall’ultima voce', () => {
    expect(p.pagineTotali).toBe(50);
  });
  it('classifica i ruoli chiave', () => {
    expect(p.sezioni.some((s) => s.ruolo === 'abstract')).toBe(true);
    expect(p.sezioni.some((s) => s.ruolo === 'conclusioni')).toBe(true);
  });
  it('dichiara la lacuna se non trova un indice', () => {
    const vuoto = estraiStruttura('solo testo senza indice, nessuna pagina numerata');
    expect(vuoto.sezioni.length).toBe(0);
    expect(vuoto.note.join(' ')).toMatch(/nessun indice/i);
  });
});

describe('profiloComune', () => {
  it('trova le regolarità fra più modelli', () => {
    const a = estraiStruttura(INDICE);
    const b = estraiStruttura(INDICE);
    const oss = profiloComune([a, b]);
    expect(oss.join(' ')).toMatch(/metodo viene sempre prima dei risultati/i);
    expect(oss.join(' ')).toMatch(/abstract è sempre presente/i);
  });
  it('non si pronuncia con un solo modello', () => {
    expect(profiloComune([estraiStruttura(INDICE)])).toEqual([]);
  });
});
