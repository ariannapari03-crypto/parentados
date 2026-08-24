import { describe, expect, it } from 'vitest';
import { giorniA, testoCountdown, generaIcs } from '../lib/tesi';
import type { ScadenzaPubblica } from '../lib/pubbliche';

// Fase 2 — logica della scrivania dello studente. Funzioni pure, niente DB.

describe('countdown alle scadenze', () => {
  const oggi = new Date('2025-06-01T10:00:00Z');
  it('conta i giorni alla data', () => {
    expect(giorniA('2025-06-09', oggi)).toBe(8);
    expect(giorniA('2025-06-01', oggi)).toBe(0);
    expect(giorniA('2025-05-30', oggi)).toBe(-2);
  });
  it('null se la data è una lacuna o malformata', () => {
    expect(giorniA(null, oggi)).toBeNull();
    expect(giorniA('boh', oggi)).toBeNull();
  });
  it('testo leggibile', () => {
    expect(testoCountdown(8)).toBe('tra 8 giorni');
    expect(testoCountdown(0)).toBe('oggi');
    expect(testoCountdown(1)).toBe('domani');
    expect(testoCountdown(-2)).toBe('2 giorni fa');
    expect(testoCountdown(null)).toBe('data non pubblicata');
  });
});

function sca(over: Partial<ScadenzaPubblica>): ScadenzaPubblica {
  return {
    id: 1, tipo: 'domanda_laurea', nome: null, data_da: '2025-06-09', data_a: null,
    blocca: false, fonte_url: 'https://x/f', fonte_citazione: 'entro il 9 giugno',
    confermato_il: '2025-05-01', sessione_nome: 'Estiva', anno_accademico: '2024/2025',
    ...over,
  };
}

describe('esportazione .ics', () => {
  const adesso = new Date('2025-05-01T00:00:00Z');

  it('crea un evento per ogni scadenza con data, salta le lacune', () => {
    const ics = generaIcs({
      corsoNome: 'Storia',
      scadenze: [sca({ id: 1, data_da: '2025-06-09' }), sca({ id: 2, data_da: null })],
      adesso,
    });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect((ics.match(/BEGIN:VEVENT/g) ?? [])).toHaveLength(1); // solo quella con data
    expect(ics).toContain('DTSTART;VALUE=DATE:20250609');
    expect(ics).toContain('UID:capitolo-1@capitolo');
    expect(ics).toContain('BEGIN:VALARM'); // promemoria a 7 giorni
    expect(ics).toContain('TRIGGER:-P7D');
  });

  it('mette la fonte nella descrizione ed è valido CRLF', () => {
    const ics = generaIcs({ corsoNome: 'Storia', scadenze: [sca({})], adesso });
    expect(ics).toContain('Fonte: https://x/f');
    expect(ics.includes('\r\n')).toBe(true);
  });
});
