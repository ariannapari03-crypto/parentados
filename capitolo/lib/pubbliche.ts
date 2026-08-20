import { query } from './db';

// Letture per le pagine pubbliche (compito ⑥). Filtrano SEMPRE su
// stato='confermata': nessuna eccezione, nemmeno in sviluppo. È l'unico modo in
// cui un dato estratto diventa visibile al pubblico. [inv. 4]
//
// Ogni riga porta con sé la sua fonte (url + citazione) e la data di conferma:
// sulla pagina la fonte sta accanto a ogni singola affermazione. [inv. 2]

export interface ScadenzaPubblica {
  id: number;
  tipo: string;
  nome: string | null;
  data_da: string | null;
  data_a: string | null;
  blocca: boolean;
  fonte_url: string;
  fonte_citazione: string;
  confermato_il: string | null;
  sessione_nome: string;
  anno_accademico: string;
}

export interface RegolaPubblica {
  id: number;
  tipo: string | null;
  testo: string;
  vincolante: boolean;
  fonte_url: string;
  fonte_citazione: string;
  confermato_il: string | null;
}

export interface CorsoPubblico {
  id: number;
  nome: string;
  livello: string | null;
  classe: string | null;
  url_prova_finale: string | null;
  dipartimento_id: number | null;
  dipartimento_nome: string | null;
  ateneo_id: number;
  ateneo_nome: string;
}

// --- slug leggibili e stabili: nome + id ---

export function slugifica(testo: string): string {
  return testo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // toglie i diacritici combinanti
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugCorso(c: { nome: string; id: number }): string {
  return `${slugifica(c.nome)}-${c.id}`;
}

export function idDaSlug(slug: string): number | null {
  const m = /-(\d+)$/.exec(slug);
  return m ? Number(m[1]) : null;
}

// --- letture ---

// I corsi che hanno qualcosa di pubblicabile: almeno una regola confermata,
// oppure un calendario confermato nel loro dipartimento.
export async function corsiPubblicabili(): Promise<CorsoPubblico[]> {
  const res = await query<Record<string, unknown>>(
    `select c.id, c.nome, c.livello, c.classe, c.url_prova_finale,
            c.dipartimento_id, d.nome as dipartimento_nome,
            c.ateneo_id, a.nome as ateneo_nome
       from corso c
       join ateneo a on a.id = c.ateneo_id
       left join dipartimento d on d.id = c.dipartimento_id
      where exists (select 1 from regola r where r.corso_id = c.id and r.stato='confermata')
         or exists (
              select 1 from scadenza sc
              join sessione s on s.id = sc.sessione_id
              where s.dipartimento_id = c.dipartimento_id and sc.stato='confermata')
      order by a.nome, c.nome, c.id`
  );
  return res.rows.map(mappaCorso);
}

export async function corsoPerId(id: number): Promise<CorsoPubblico | null> {
  const res = await query<Record<string, unknown>>(
    `select c.id, c.nome, c.livello, c.classe, c.url_prova_finale,
            c.dipartimento_id, d.nome as dipartimento_nome,
            c.ateneo_id, a.nome as ateneo_nome
       from corso c
       join ateneo a on a.id = c.ateneo_id
       left join dipartimento d on d.id = c.dipartimento_id
      where c.id = $1`,
    [id]
  );
  return res.rows.length ? mappaCorso(res.rows[0]) : null;
}

function mappaCorso(r: Record<string, unknown>): CorsoPubblico {
  return {
    id: Number(r.id as string),
    nome: r.nome as string,
    livello: (r.livello as string) ?? null,
    classe: (r.classe as string) ?? null,
    url_prova_finale: (r.url_prova_finale as string) ?? null,
    dipartimento_id: r.dipartimento_id == null ? null : Number(r.dipartimento_id as string),
    dipartimento_nome: (r.dipartimento_nome as string) ?? null,
    ateneo_id: Number(r.ateneo_id as string),
    ateneo_nome: r.ateneo_nome as string,
  };
}

export async function scadenzeConfermatePerDipartimento(
  dipartimentoId: number
): Promise<ScadenzaPubblica[]> {
  const res = await query<Record<string, string>>(
    `select sc.id, sc.tipo, sc.nome,
            to_char(sc.data_da,'YYYY-MM-DD') as data_da,
            to_char(sc.data_a,'YYYY-MM-DD')  as data_a,
            sc.blocca, sc.fonte_url, sc.fonte_citazione,
            to_char(sc.confermato_il,'YYYY-MM-DD') as confermato_il,
            s.nome as sessione_nome, s.anno_accademico
       from scadenza sc
       join sessione s on s.id = sc.sessione_id
      where s.dipartimento_id = $1 and sc.stato = 'confermata'
      order by s.anno_accademico, sc.data_da nulls last, sc.id`,
    [dipartimentoId]
  );
  return res.rows.map((r) => ({
    id: Number(r.id),
    tipo: r.tipo,
    nome: r.nome ?? null,
    data_da: r.data_da ?? null,
    data_a: r.data_a ?? null,
    blocca: (r.blocca as unknown) === true || r.blocca === 'true',
    fonte_url: r.fonte_url,
    fonte_citazione: r.fonte_citazione,
    confermato_il: r.confermato_il ?? null,
    sessione_nome: r.sessione_nome,
    anno_accademico: r.anno_accademico,
  }));
}

export async function regoleConfermatePerCorso(corsoId: number): Promise<RegolaPubblica[]> {
  const res = await query<Record<string, unknown>>(
    `select id, tipo, testo, vincolante, fonte_url, fonte_citazione,
            to_char(confermato_il,'YYYY-MM-DD') as confermato_il
       from regola
      where corso_id = $1 and stato = 'confermata'
      order by id`,
    [corsoId]
  );
  return res.rows.map((r) => ({
    id: Number(r.id as string),
    tipo: (r.tipo as string) ?? null,
    testo: r.testo as string,
    vincolante: r.vincolante === true,
    fonte_url: r.fonte_url as string,
    fonte_citazione: r.fonte_citazione as string,
    confermato_il: (r.confermato_il as string) ?? null,
  }));
}

// La data di ultima verifica mostrata sulla pagina: la conferma più recente fra
// scadenze e regole visibili.
export function ultimaVerifica(
  scadenze: ScadenzaPubblica[],
  regole: RegolaPubblica[]
): string | null {
  const date = [...scadenze, ...regole]
    .map((x) => x.confermato_il)
    .filter((d): d is string => d != null);
  return date.length ? date.sort().at(-1)! : null;
}
