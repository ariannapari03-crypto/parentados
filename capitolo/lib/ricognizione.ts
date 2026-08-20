import { parse } from 'node-html-parser';
import { pool } from './db';
import type { Recuperatore } from './scarica';
import { recuperaConFetch } from './scarica';

// Compito ⑦: ricognizione. Dato il NOME di un ateneo scritto in un campo di
// testo, lo si cerca sul momento sul web, si apre il catalogo dei corsi e si
// enumerano i corsi con la loro URL. Il sistema è agnostico rispetto all'ateneo:
// nessun elenco fisso nel codice. [vedi CLAUDE.md]
//
// Nulla è inventato: i corsi vengono SOLO dai link presenti nelle pagine reali
// scaricate. Le voci scoperte restano da verificare (verificato_il = null)
// finché una persona non le controlla.

export interface RisultatoRicerca {
  titolo: string;
  url: string;
  frammento?: string;
}

// Cercatore: una ricerca web, iniettabile. In produzione usa un motore reale
// (vedi lib/cercatore.ts); nei test si inietta una funzione con risultati finti.
export type Cercatore = (query: string) => Promise<RisultatoRicerca[]>;

export interface CorsoScoperto {
  nome: string;
  url: string;
}

// Un link è una pagina di corso se il percorso ha un segmento di catalogo
// (corsi/laurea/…) seguito da uno slug: distingue le schede dei corsi dalle voci
// di menu e dall'indice del catalogo.
const PERCORSO_CORSO = /\/(corsi|corso|laurea|lauree|corso-di-laurea|corsi-di-laurea|cds|degree)\/[^/?#]+/i;

// Testi d'ancora che denotano un corso.
const TESTO_CORSO = /^(corso di laurea|laurea (magistrale|triennale|magistrale a ciclo unico)|laurea in|corso di studio)/i;

export function scopriCorsi(html: string, baseUrl: string): CorsoScoperto[] {
  const radice = parse(html);
  const visti = new Set<string>();
  const corsi: CorsoScoperto[] = [];
  for (const a of radice.querySelectorAll('a[href]')) {
    const href = (a.getAttribute('href') ?? '').trim();
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) continue;
    let assoluto: string;
    try {
      assoluto = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    if (!/^https?:/i.test(assoluto)) continue;
    const percorso = new URL(assoluto).pathname;
    const testo = a.text.replace(/\s+/g, ' ').trim();
    const paginaDiCorso = PERCORSO_CORSO.test(percorso) || TESTO_CORSO.test(testo);
    if (!paginaDiCorso) continue;
    if (testo.length < 3) continue; // scarta ancore vuote/icone
    const chiave = assoluto.split('#')[0];
    if (visti.has(chiave)) continue;
    visti.add(chiave);
    corsi.push({ nome: testo, url: chiave });
  }
  return corsi;
}

// Sceglie l'URL del catalogo fra i risultati di ricerca: preferisce un dominio
// universitario (.unibo.it, .unito.it, …) e un percorso che parla di corsi.
export function scegliCatalogo(risultati: RisultatoRicerca[]): string | null {
  if (risultati.length === 0) return null;
  const conCorsi = risultati.find((r) => /cors|laurea/i.test(r.url));
  return (conCorsi ?? risultati[0]).url;
}

// Upsert dell'ateneo per nome (case-insensitive). Nessun vincolo unico a schema:
// facciamo select-then-insert (strumento da operatore, non concorrente).
export async function upsertAteneo(nome: string, dominioMail?: string | null): Promise<number> {
  const esistente = await pool().query<{ id: string }>(
    'select id from ateneo where lower(nome) = lower($1) limit 1',
    [nome]
  );
  if (esistente.rows.length > 0) return Number(esistente.rows[0].id);
  const ins = await pool().query<{ id: string }>(
    'insert into ateneo (nome, dominio_mail) values ($1, $2) returning id',
    [nome, dominioMail ?? null]
  );
  return Number(ins.rows[0].id);
}

// Salva i corsi scoperti che non ci sono già (dedup per url_prova_finale).
// Restituisce quanti nuovi corsi sono stati inseriti.
export async function salvaCorsiScoperti(
  ateneoId: number,
  corsi: CorsoScoperto[]
): Promise<number> {
  let nuovi = 0;
  for (const c of corsi) {
    const gia = await pool().query(
      'select 1 from corso where ateneo_id = $1 and url_prova_finale = $2 limit 1',
      [ateneoId, c.url]
    );
    if (gia.rows.length > 0) continue;
    await pool().query(
      'insert into corso (ateneo_id, nome, url_prova_finale) values ($1, $2, $3)',
      [ateneoId, c.nome, c.url]
    );
    nuovi += 1;
  }
  return nuovi;
}

export interface EsitoRicognizione {
  ateneoId: number;
  catalogoUrl: string | null;
  scoperti: CorsoScoperto[];
  nuovi: number;
}

// Orchestrazione: cerca l'ateneo sul momento, apre il catalogo, enumera i corsi
// e li salva (da verificare). Search e fetch sono iniettabili.
export async function ricognizioneAteneo(
  nome: string,
  deps: { cerca: Cercatore; recupera?: Recuperatore }
): Promise<EsitoRicognizione> {
  const recupera = deps.recupera ?? recuperaConFetch;
  const risultati = await deps.cerca(`${nome} corsi di laurea`);
  const catalogoUrl = scegliCatalogo(risultati);

  const ateneoId = await upsertAteneo(nome);
  if (!catalogoUrl) {
    return { ateneoId, catalogoUrl: null, scoperti: [], nuovi: 0 };
  }

  const pagina = await recupera(catalogoUrl);
  const scoperti = scopriCorsi(pagina.corpo.toString('utf8'), pagina.urlFinale);
  const nuovi = await salvaCorsiScoperti(ateneoId, scoperti);
  return { ateneoId, catalogoUrl: pagina.urlFinale, scoperti, nuovi };
}
