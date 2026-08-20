import { query } from './db';

// Compito ⑤: revisione. Legge le PROPOSTE e le porta a 'confermata' o
// 'scartata' (o 'corretta' = modificata e confermata). Solo una persona compie
// questo passaggio: è la valvola che separa un database utile da un generatore
// di disinformazione. [inv. 4]
//
// Le date sono restituite come testo 'YYYY-MM-DD' (via to_char) per evitare
// slittamenti di fuso orario nel viaggio Postgres → JS.

export interface ScadenzaDaRevisionare {
  id: number;
  tipo: string;
  nome: string | null;
  data_da: string | null;
  data_a: string | null;
  blocca: boolean;
  fonte_url: string;
  fonte_citazione: string;
  confidenza: number | null;
  sessione_nome: string;
  anno_accademico: string;
  dipartimento_nome: string;
  ateneo_nome: string;
}

export interface RegolaDaRevisionare {
  id: number;
  tipo: string | null;
  testo: string;
  valore: unknown | null;
  vincolante: boolean;
  fonte_url: string;
  fonte_citazione: string;
  confidenza: number | null;
  corso_nome: string;
  ateneo_nome: string;
}

const N = (v: string | number) => Number(v);

export async function prossimeScadenze(limite = 50): Promise<ScadenzaDaRevisionare[]> {
  const res = await query<Record<string, string>>(
    `select sc.id, sc.tipo, sc.nome,
            to_char(sc.data_da,'YYYY-MM-DD') as data_da,
            to_char(sc.data_a,'YYYY-MM-DD')  as data_a,
            sc.blocca, sc.fonte_url, sc.fonte_citazione, sc.confidenza,
            s.nome as sessione_nome, s.anno_accademico,
            d.nome as dipartimento_nome, a.nome as ateneo_nome
       from scadenza sc
       join sessione s     on s.id = sc.sessione_id
       join dipartimento d on d.id = s.dipartimento_id
       join ateneo a       on a.id = d.ateneo_id
      where sc.stato = 'proposta'
      order by a.nome, d.nome, s.anno_accademico, sc.data_da nulls last, sc.id
      limit $1`,
    [limite]
  );
  return res.rows.map((r) => ({
    id: N(r.id),
    tipo: r.tipo,
    nome: r.nome ?? null,
    data_da: r.data_da ?? null,
    data_a: r.data_a ?? null,
    blocca: r.blocca === 'true' || (r.blocca as unknown) === true,
    fonte_url: r.fonte_url,
    fonte_citazione: r.fonte_citazione,
    confidenza: r.confidenza == null ? null : Number(r.confidenza),
    sessione_nome: r.sessione_nome,
    anno_accademico: r.anno_accademico,
    dipartimento_nome: r.dipartimento_nome,
    ateneo_nome: r.ateneo_nome,
  }));
}

export async function prossimeRegole(limite = 50): Promise<RegolaDaRevisionare[]> {
  const res = await query<Record<string, unknown>>(
    `select r.id, r.tipo, r.testo, r.valore, r.vincolante,
            r.fonte_url, r.fonte_citazione, r.confidenza,
            c.nome as corso_nome, a.nome as ateneo_nome
       from regola r
       join corso c  on c.id = r.corso_id
       join ateneo a on a.id = c.ateneo_id
      where r.stato = 'proposta'
      order by a.nome, c.nome, r.id
      limit $1`,
    [limite]
  );
  return res.rows.map((r) => ({
    id: N(r.id as string),
    tipo: (r.tipo as string) ?? null,
    testo: r.testo as string,
    valore: r.valore ?? null,
    vincolante: r.vincolante === true,
    fonte_url: r.fonte_url as string,
    fonte_citazione: r.fonte_citazione as string,
    confidenza: r.confidenza == null ? null : Number(r.confidenza),
    corso_nome: r.corso_nome as string,
    ateneo_nome: r.ateneo_nome as string,
  }));
}

export async function contaProposte(): Promise<{ scadenze: number; regole: number }> {
  const s = await query<{ n: string }>("select count(*)::text n from scadenza where stato='proposta'");
  const r = await query<{ n: string }>("select count(*)::text n from regola where stato='proposta'");
  return { scadenze: Number(s.rows[0].n), regole: Number(r.rows[0].n) };
}

// --- transizioni di stato: solo una persona le compie [inv. 4] ---

export async function confermaScadenza(id: number): Promise<void> {
  await query("update scadenza set stato='confermata', confermato_il=now() where id=$1", [id]);
}
export async function scartaScadenza(id: number): Promise<void> {
  await query("update scadenza set stato='scartata' where id=$1", [id]);
}

export interface CorrezioneScadenza {
  tipo?: string;
  nome?: string | null;
  data_da?: string | null;
  data_a?: string | null;
  blocca?: boolean;
  fonte_citazione?: string;
}

// «Corretta» = modificata e confermata in un colpo solo.
export async function correggiScadenza(id: number, patch: CorrezioneScadenza): Promise<void> {
  const campi: string[] = [];
  const valori: unknown[] = [];
  const set = (col: string, val: unknown) => {
    valori.push(val);
    campi.push(`${col} = $${valori.length}`);
  };
  if (patch.tipo !== undefined) set('tipo', patch.tipo);
  if (patch.nome !== undefined) set('nome', patch.nome);
  if (patch.data_da !== undefined) set('data_da', patch.data_da);
  if (patch.data_a !== undefined) set('data_a', patch.data_a);
  if (patch.blocca !== undefined) set('blocca', patch.blocca);
  if (patch.fonte_citazione !== undefined) set('fonte_citazione', patch.fonte_citazione);
  campi.push("stato = 'confermata'", 'confermato_il = now()');
  valori.push(id);
  await query(`update scadenza set ${campi.join(', ')} where id = $${valori.length}`, valori);
}

export async function confermaRegola(id: number): Promise<void> {
  await query("update regola set stato='confermata', confermato_il=now() where id=$1", [id]);
}
export async function scartaRegola(id: number): Promise<void> {
  await query("update regola set stato='scartata' where id=$1", [id]);
}

export interface CorrezioneRegola {
  tipo?: string | null;
  testo?: string;
  vincolante?: boolean;
  fonte_citazione?: string;
}

export async function correggiRegola(id: number, patch: CorrezioneRegola): Promise<void> {
  const campi: string[] = [];
  const valori: unknown[] = [];
  const set = (col: string, val: unknown) => {
    valori.push(val);
    campi.push(`${col} = $${valori.length}`);
  };
  if (patch.tipo !== undefined) set('tipo', patch.tipo);
  if (patch.testo !== undefined) set('testo', patch.testo);
  if (patch.vincolante !== undefined) set('vincolante', patch.vincolante);
  if (patch.fonte_citazione !== undefined) set('fonte_citazione', patch.fonte_citazione);
  campi.push("stato = 'confermata'", 'confermato_il = now()');
  valori.push(id);
  await query(`update regola set ${campi.join(', ')} where id = $${valori.length}`, valori);
}
