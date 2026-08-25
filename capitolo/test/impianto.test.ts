import { describe, expect, it } from 'vitest';
import {
  numeroDecimale,
  indiceIniziale,
  impiantoIniziale,
  profiloDisciplina,
  paginesSezione,
  avanzamento,
  avvisiImpianto,
  statoSuccessivo,
  statoPrecedente,
  ordineStato,
  eCornice,
  eBibliografia,
  type Impianto,
  type Sezione,
} from '../lib/impianto';

// Fase 2 — logica dell'impianto della tesi. Funzioni pure, niente DB, niente
// browser. Ogni cosa qui è consiglio: gli avvisi non bloccano mai. [inv. 9]

function sez(over: Partial<Sezione>): Sezione {
  return { id: over.id ?? 'x', titolo: over.titolo ?? 'S', stato: 'vuota', figli: [], ...over };
}

describe('numerazione decimale', () => {
  it('parte da 1 e concatena i livelli', () => {
    expect(numeroDecimale([0])).toBe('1');
    expect(numeroDecimale([1, 0])).toBe('2.1');
    expect(numeroDecimale([1, 0, 2])).toBe('2.1.3');
  });
});

describe('stati della sezione', () => {
  it('avanzano e arretrano senza uscire dagli estremi', () => {
    expect(statoSuccessivo('vuota')).toBe('in_bozza');
    expect(statoSuccessivo('chiusa')).toBe('chiusa');
    expect(statoPrecedente('vuota')).toBe('vuota');
    expect(statoPrecedente('chiusa')).toBe('revisionata');
    expect(ordineStato('vuota')).toBeLessThan(ordineStato('chiusa'));
  });
});

describe('indice iniziale per disciplina', () => {
  it('STEM segue IMRAD, umanistica è tematica', () => {
    const stem = indiceIniziale('stem').map((s) => s.titolo);
    expect(stem).toContain('Materiali e metodi');
    expect(stem).toContain('Risultati');
    expect(stem).toContain('Discussione');

    const uma = indiceIniziale('umanistica').map((s) => s.titolo);
    expect(uma.some((t) => /nucleo tematico/i.test(t))).toBe(true);
    expect(uma).not.toContain('Materiali e metodi');
  });
  it('entrambe hanno introduzione, conclusioni e bibliografia', () => {
    for (const d of ['stem', 'umanistica'] as const) {
      const titoli = indiceIniziale(d).map((s) => s.titolo);
      expect(titoli.some(eCornice)).toBe(true);
      expect(titoli.some(eBibliografia)).toBe(true);
    }
  });
  it('il profilo cambia stile citazionale ed editor', () => {
    expect(profiloDisciplina('stem').editorConsigliato).toMatch(/LaTeX/);
    expect(profiloDisciplina('umanistica').stileCitazionale).toMatch(/piè di pagina/);
  });
});

describe('peso in pagine', () => {
  it('usa il range proprio se presente', () => {
    expect(paginesSezione(sez({ pagineDa: 10, pagineA: 20 }))).toBe(11);
  });
  it('somma i figli se la sezione non ha range proprio', () => {
    const s = sez({
      figli: [sez({ pagineDa: 1, pagineA: 5 }), sez({ pagineDa: 6, pagineA: 10 })],
    });
    expect(paginesSezione(s)).toBe(10);
  });
  it('null quando non c’è alcuna informazione', () => {
    expect(paginesSezione(sez({}))).toBeNull();
    expect(paginesSezione(sez({ pagineDa: 5, pagineA: 2 }))).toBeNull(); // range assurdo
  });
});

describe('avanzamento', () => {
  it('conta le sezioni chiuse su tutto l’albero', () => {
    const sezioni = [
      sez({ stato: 'chiusa', figli: [sez({ stato: 'vuota' })] }),
      sez({ stato: 'chiusa' }),
    ];
    const a = avanzamento(sezioni);
    expect(a.totali).toBe(3);
    expect(a.chiuse).toBe(2);
    expect(a.percentuale).toBe(67);
  });
});

describe('avvisi — guidano, non bloccano', () => {
  function imp(over: Partial<Impianto>): Impianto {
    return { disciplina: 'umanistica', domandaRicerca: 'Q', briefing: '', sezioni: [], ...over };
  }

  it('segnala la domanda di ricerca mancante', () => {
    const a = avvisiImpianto(imp({ domandaRicerca: '   ' }));
    expect(a.some((x) => x.id === 'domanda-mancante')).toBe(true);
  });

  it('non segnala la domanda se è presente', () => {
    const a = avvisiImpianto(imp({ domandaRicerca: 'Se X allora Y' }));
    expect(a.some((x) => x.id === 'domanda-mancante')).toBe(false);
  });

  it('segnala le sezioni senza peso in pagine', () => {
    const a = avvisiImpianto(
      imp({ sezioni: [sez({ titolo: 'Capitolo 1' }), sez({ titolo: 'Bibliografia' })] })
    );
    expect(a.some((x) => x.id === 'pagine-mancanti')).toBe(true);
  });

  it('segnala uno squilibrio: una sezione oltre metà del totale', () => {
    const a = avvisiImpianto(
      imp({
        sezioni: [
          sez({ titolo: 'Capitolo 1', pagineDa: 1, pagineA: 60 }),
          sez({ titolo: 'Capitolo 2', pagineDa: 61, pagineA: 70 }),
          sez({ titolo: 'Capitolo 3', pagineDa: 71, pagineA: 80 }),
        ],
      })
    );
    expect(a.some((x) => x.id.startsWith('squilibrio-'))).toBe(true);
  });

  it('difende l’ordine di stesura: introduzione avviata coi centrali vuoti', () => {
    const a = avvisiImpianto(
      imp({
        sezioni: [
          sez({ titolo: 'Introduzione', stato: 'in_bozza' }),
          sez({ titolo: 'Capitolo centrale', stato: 'vuota' }),
        ],
      })
    );
    expect(a.some((x) => x.id.startsWith('ordine-'))).toBe(true);
  });

  it('nessun avviso d’ordine se i centrali non sono vuoti', () => {
    const a = avvisiImpianto(
      imp({
        sezioni: [
          sez({ titolo: 'Introduzione', stato: 'in_bozza' }),
          sez({ titolo: 'Capitolo centrale', stato: 'prima_stesura' }),
        ],
      })
    );
    expect(a.some((x) => x.id.startsWith('ordine-'))).toBe(false);
  });
});

describe('impianto iniziale', () => {
  it('parte con disciplina, domanda vuota e le sezioni del template', () => {
    const i = impiantoIniziale('stem');
    expect(i.disciplina).toBe('stem');
    expect(i.domandaRicerca).toBe('');
    expect(i.sezioni.length).toBeGreaterThan(3);
  });
});
