import Anthropic from '@anthropic-ai/sdk';

// Compito ④: estrazione. Chiama il modello sul testo (ritagliato da HTML o
// ricavato da PDF) e produce PROPOSTE. Due estrattori distinti:
//   - calendario del DIPARTIMENTO (sessioni + scadenze)  [date per dipartimento]
//   - regole del CORSO                                    [regole per corso]
//
// Invarianti forzati QUI, non solo chiesti al modello:
//   [inv. 1] mai inventare una data: ogni data proposta deve comparire scritta
//            nel testo, altrimenti la scadenza viene scartata.
//   [inv. 2] ogni affermazione porta la fonte: `fonte_citazione` (frase esatta)
//            deve essere una sottostringa del testo; senza, l'affermazione è
//            scartata (non «parziale»).
//   [inv. 4] tutto nasce 'proposta' (lo impone lo schema al salvataggio).
//   [inv. 8] la chiave API si legge solo dall'ambiente, mai dal codice/browser.
//
// I prompt sono versionati: ogni estrazione registra quale versione ha usato.

export const VERSIONE_PROMPT = '1';

// ------------------------------------------------------------------ modello --

export interface RichiestaModello {
  sistema: string;
  utente: string;
}

export interface RispostaModello {
  testo: string;
  modello: string;
  costo: number | null; // stima in dollari
}

export interface ClienteModello {
  completa(richiesta: RichiestaModello): Promise<RispostaModello>;
}

// Prezzo per 1M di token (Claude Opus 5). Usato solo per una stima del costo.
const PREZZO_INPUT_PER_M = 5;
const PREZZO_OUTPUT_PER_M = 25;

// Client di produzione. `new Anthropic()` legge ANTHROPIC_API_KEY dall'ambiente:
// nessuna chiave nel codice, nessuna chiamata dal browser. [inv. 8]
export function clienteAnthropic(modello = 'claude-opus-5'): ClienteModello {
  const client = new Anthropic();
  return {
    async completa({ sistema, utente }) {
      // Campi come `output_config`/`thinking` possono non essere ancora tipizzati
      // nella versione dell'SDK installata: costruiamo i parametri senza vincolo
      // di tipo, solo qui nel client di produzione.
      const parametri: Record<string, unknown> = {
        model: modello,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
        system: sistema,
        messages: [{ role: 'user', content: utente }],
      };
      const risposta = await client.messages.create(
        parametri as unknown as Anthropic.MessageCreateParamsNonStreaming
      );
      const testo = risposta.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      const uso = risposta.usage;
      const costo =
        uso == null
          ? null
          : (uso.input_tokens / 1_000_000) * PREZZO_INPUT_PER_M +
            (uso.output_tokens / 1_000_000) * PREZZO_OUTPUT_PER_M;
      return { testo, modello: risposta.model, costo };
    },
  };
}

// --------------------------------------------------------------- validazione --

function normalizzaSpazi(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// La citazione è valida se non è vuota ed è una sottostringa del testo (a meno
// di spazi). È la garanzia che l'affermazione venga davvero dal documento.
export function citazioneAncorata(citazione: string, testo: string): boolean {
  const c = normalizzaSpazi(citazione);
  if (c.length === 0) return false;
  return normalizzaSpazi(testo).includes(c);
}

// La data è ammessa solo se compare scritta nel testo, in una delle forme
// comuni. Non si deduce, non si stima. [inv. 1]
export function dataScrittaNelTesto(iso: string, testo: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return false;
  const [, a, mm, gg] = m;
  const g = String(Number(gg));
  const me = String(Number(mm));
  const t = normalizzaSpazi(testo);
  const forme = [
    `${gg}/${mm}/${a}`, `${g}/${me}/${a}`,
    `${gg}-${mm}-${a}`, `${gg}.${mm}.${a}`, `${g}.${me}.${a}`,
    `${a}-${mm}-${gg}`,
  ];
  return forme.some((f) => t.includes(f));
}

// --------------------------------------------------------------- tipi output --

export type Esito = 'riuscita' | 'parziale' | 'fallita';

export interface ScadenzaProposta {
  tipo: string;
  nome: string | null;
  data_da: string | null; // ISO yyyy-mm-dd, oppure null (lacuna)
  data_a: string | null;
  blocca: boolean;
  fonte_url: string;
  fonte_citazione: string;
  confidenza: number | null;
}

export interface SessioneProposta {
  nome: string;
  anno_accademico: string;
  seduta_da: string | null;
  seduta_a: string | null;
  scadenze: ScadenzaProposta[];
}

export interface RegolaProposta {
  tipo: string | null;
  testo: string;
  valore: unknown | null;
  vincolante: boolean;
  classe: string | null;
  fonte_url: string;
  fonte_citazione: string;
  confidenza: number | null;
}

export interface EsitoCalendario {
  sessioni: SessioneProposta[];
  esito: Esito;
  scartate: number; // scadenze rifiutate perché senza fonte o con data non scritta
  modello: string;
  promptVersione: string;
  costo: number | null;
}

export interface EsitoRegole {
  regole: RegolaProposta[];
  esito: Esito;
  scartate: number;
  modello: string;
  promptVersione: string;
  costo: number | null;
}

// Estrae il primo oggetto JSON dalla risposta del modello. Robusto a eventuale
// testo prima/dopo.
function estraiJson(testo: string): unknown {
  const inizio = testo.indexOf('{');
  const fine = testo.lastIndexOf('}');
  if (inizio === -1 || fine === -1 || fine < inizio) {
    throw new Error('nessun oggetto JSON nella risposta del modello');
  }
  return JSON.parse(testo.slice(inizio, fine + 1));
}

function comeStringa(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

// ---------------------------------------------------------------- prompt ----

const PROMPT_CALENDARIO = `Sei un estrattore di scadenze della prova finale (tesi) dai documenti degli atenei italiani.

Ti do il TESTO di un documento (pagina o PDF). Estrai le sessioni di laurea e, per ciascuna, le scadenze (domanda di laurea, consegna dell'elaborato, seduta, ecc.).

Regole assolute:
- Usa SOLO ciò che è scritto nel testo. Non dedurre da altri anni o corsi, non stimare, non inventare.
- Per ogni scadenza copia in "fonte_citazione" la frase ESATTA del testo da cui ricavi il dato (verbatim, senza parafrasi).
- Le date vanno in formato ISO "yyyy-mm-dd". Se una scadenza esiste ma la data non è scritta, metti "data_da": null e comunque la frase in "fonte_citazione".
- Non aggiungere scadenze che non trovi nel testo.

Rispondi SOLO con JSON valido, senza testo attorno, in questa forma:
{
  "sessioni": [
    {
      "nome": "string",
      "anno_accademico": "string (es. 2024/2025)",
      "seduta_da": "yyyy-mm-dd | null",
      "seduta_a": "yyyy-mm-dd | null",
      "scadenze": [
        {
          "tipo": "string (es. domanda_laurea, consegna_tesi, seduta)",
          "nome": "string | null",
          "data_da": "yyyy-mm-dd | null",
          "data_a": "yyyy-mm-dd | null",
          "blocca": true,
          "fonte_citazione": "frase esatta dal testo",
          "confidenza": 0.0
        }
      ]
    }
  ]
}`;

const PROMPT_REGOLE = `Sei un estrattore di regole della prova finale (tesi) dalle pagine dei corsi di laurea italiani.

Ti do il TESTO di una pagina. Estrai le regole del corso sulla prova finale: lunghezza, formato, criteri di voto, requisiti, ecc.

Regole assolute:
- Usa SOLO ciò che è scritto nel testo. Non inventare, non generalizzare da altri corsi.
- Per ogni regola copia in "fonte_citazione" la frase ESATTA del testo (verbatim).
- "vincolante" è true SOLO se il regolamento la rende obbligatoria/bloccante. Se il testo la dà come orientativa, indicativa, consigliata o simili, "vincolante" è false.
- In "valore" metti una forma strutturata quando ha senso (es. {"pagine_min":40,"pagine_max":60}), altrimenti null.

Rispondi SOLO con JSON valido, senza testo attorno, in questa forma:
{
  "regole": [
    {
      "tipo": "string | null (es. lunghezza, formato, criterio_voto)",
      "testo": "la regola in chiaro",
      "valore": {} ,
      "vincolante": false,
      "classe": "string | null",
      "fonte_citazione": "frase esatta dal testo",
      "confidenza": 0.0
    }
  ]
}`;

// ------------------------------------------------------------- estrazione ----

export async function estraiCalendario(
  testo: string,
  fonteUrl: string,
  cliente: ClienteModello
): Promise<EsitoCalendario> {
  const promptVersione = `calendario/${VERSIONE_PROMPT}`;
  const risposta = await cliente.completa({ sistema: PROMPT_CALENDARIO, utente: testo });

  let dati: { sessioni?: unknown[] };
  try {
    dati = estraiJson(risposta.testo) as { sessioni?: unknown[] };
  } catch {
    return { sessioni: [], esito: 'fallita', scartate: 0, modello: risposta.modello, promptVersione, costo: risposta.costo };
  }

  let scartate = 0;
  const sessioni: SessioneProposta[] = [];
  for (const sGrezza of dati.sessioni ?? []) {
    const s = sGrezza as Record<string, unknown>;
    const nome = comeStringa(s.nome);
    const anno = comeStringa(s.anno_accademico);
    if (!nome || !anno) {
      scartate += Array.isArray(s.scadenze) ? s.scadenze.length : 0;
      continue;
    }
    const scadenze: ScadenzaProposta[] = [];
    for (const scGrezza of (s.scadenze as unknown[]) ?? []) {
      const sc = scGrezza as Record<string, unknown>;
      const tipo = comeStringa(sc.tipo);
      const citazione = comeStringa(sc.fonte_citazione);
      const dataDa = comeStringa(sc.data_da);
      // [inv. 2] senza fonte ancorata → scartata. [inv. 1] data non scritta → scartata.
      if (!tipo || !citazione || !citazioneAncorata(citazione, testo)) {
        scartate += 1;
        continue;
      }
      if (dataDa && !dataScrittaNelTesto(dataDa, testo)) {
        scartate += 1;
        continue;
      }
      scadenze.push({
        tipo,
        nome: comeStringa(sc.nome),
        data_da: dataDa,
        data_a: comeStringa(sc.data_a),
        blocca: sc.blocca === true,
        fonte_url: fonteUrl,
        fonte_citazione: citazione,
        confidenza: typeof sc.confidenza === 'number' ? sc.confidenza : null,
      });
    }
    if (scadenze.length > 0) {
      sessioni.push({
        nome,
        anno_accademico: anno,
        seduta_da: comeStringa(s.seduta_da),
        seduta_a: comeStringa(s.seduta_a),
        scadenze,
      });
    }
  }

  const prodotte = sessioni.reduce((n, s) => n + s.scadenze.length, 0);
  const esito: Esito = prodotte === 0 ? 'fallita' : scartate > 0 ? 'parziale' : 'riuscita';
  return { sessioni, esito, scartate, modello: risposta.modello, promptVersione, costo: risposta.costo };
}

export async function estraiRegole(
  testo: string,
  fonteUrl: string,
  cliente: ClienteModello
): Promise<EsitoRegole> {
  const promptVersione = `regole/${VERSIONE_PROMPT}`;
  const risposta = await cliente.completa({ sistema: PROMPT_REGOLE, utente: testo });

  let dati: { regole?: unknown[] };
  try {
    dati = estraiJson(risposta.testo) as { regole?: unknown[] };
  } catch {
    return { regole: [], esito: 'fallita', scartate: 0, modello: risposta.modello, promptVersione, costo: risposta.costo };
  }

  let scartate = 0;
  const regole: RegolaProposta[] = [];
  for (const rGrezza of dati.regole ?? []) {
    const r = rGrezza as Record<string, unknown>;
    const testoRegola = comeStringa(r.testo);
    const citazione = comeStringa(r.fonte_citazione);
    if (!testoRegola || !citazione || !citazioneAncorata(citazione, testo)) {
      scartate += 1; // [inv. 2]
      continue;
    }
    regole.push({
      tipo: comeStringa(r.tipo),
      testo: testoRegola,
      valore: r.valore ?? null,
      // [inv. 9] i consigli restano consigli: vincolante solo se esplicito true.
      vincolante: r.vincolante === true,
      classe: comeStringa(r.classe),
      fonte_url: fonteUrl,
      fonte_citazione: citazione,
      confidenza: typeof r.confidenza === 'number' ? r.confidenza : null,
    });
  }

  const esito: Esito = regole.length === 0 ? 'fallita' : scartate > 0 ? 'parziale' : 'riuscita';
  return { regole, esito, scartate, modello: risposta.modello, promptVersione, costo: risposta.costo };
}
