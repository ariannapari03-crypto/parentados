import type { ScadenzaPubblica } from './pubbliche';

// Logica della «scrivania della tesi» per lo studente (Fase 2). Solo dati
// confermati arrivano qui (le query stanno in lib/pubbliche). Nessuna data
// inventata: se manca, resta lacuna. [inv. 1, 4]

export function etichettaTipoScadenza(tipo: string): string {
  const m: Record<string, string> = {
    domanda_laurea: 'Domanda di laurea',
    consegna_tesi: 'Consegna dell’elaborato',
    consegna_elaborato: 'Consegna dell’elaborato',
    seduta: 'Seduta di laurea',
    benestare: 'Benestare del relatore',
  };
  return m[tipo] ?? tipo.replace(/_/g, ' ');
}

// Giorni da oggi alla data ISO (yyyy-mm-dd). Negativo se già passata, null se
// la data non è pubblicata (lacuna).
export function giorniA(iso: string | null, oggi: Date = new Date()): number | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const target = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const base = Date.UTC(oggi.getUTCFullYear(), oggi.getUTCMonth(), oggi.getUTCDate());
  return Math.round((target - base) / 86_400_000);
}

export function testoCountdown(giorni: number | null): string {
  if (giorni === null) return 'data non pubblicata';
  if (giorni === 0) return 'oggi';
  if (giorni === 1) return 'domani';
  if (giorni > 1) return `tra ${giorni} giorni`;
  if (giorni === -1) return 'ieri';
  return `${-giorni} giorni fa`;
}

// --- esportazione calendario .ics ---

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function dataIcs(iso: string): string {
  return iso.replace(/-/g, ''); // yyyy-mm-dd -> yyyymmdd
}

// Genera un file .ics con un evento (tutto il giorno) per ogni scadenza CON
// data, più un promemoria a 7 giorni. Le scadenze senza data restano fuori dal
// calendario ma vanno mostrate come lacune nella pagina.
export function generaIcs(params: {
  corsoNome: string;
  scadenze: ScadenzaPubblica[];
  adesso?: Date;
}): string {
  const now = params.adesso ?? new Date();
  const stamp =
    now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const righe: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Capitolo//Scadenze tesi//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const sc of params.scadenze) {
    if (!sc.data_da) continue; // niente evento per le lacune
    const inizio = dataIcs(sc.data_da);
    const nome = sc.nome ?? etichettaTipoScadenza(sc.tipo);
    righe.push(
      'BEGIN:VEVENT',
      `UID:capitolo-${sc.id}@capitolo`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${inizio}`,
      `SUMMARY:${escapeIcs(`${nome} — ${params.corsoNome}`)}`,
      `DESCRIPTION:${escapeIcs(`${sc.fonte_citazione}\nFonte: ${sc.fonte_url}`)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcs(`Fra 7 giorni: ${nome}`)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }
  righe.push('END:VCALENDAR');
  return righe.join('\r\n');
}
