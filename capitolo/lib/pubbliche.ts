import { query } from './db';

// Letture per le pagine pubbliche. Filtrano SEMPRE su stato='confermata':
// nessuna eccezione, nemmeno in sviluppo. È l'unico modo in cui un dato
// estratto diventa visibile al pubblico. [inv. 4]

export interface ScadenzaPubblica {
  id: number;
  tipo: string;
  nome: string | null;
  data_da: string | null;
  data_a: string | null;
  blocca: boolean;
  fonte_url: string;
  fonte_citazione: string;
}

export interface RegolaPubblica {
  id: number;
  tipo: string | null;
  testo: string;
  vincolante: boolean;
  fonte_url: string;
  fonte_citazione: string;
}

export async function scadenzeConfermatePerDipartimento(
  dipartimentoId: number
): Promise<ScadenzaPubblica[]> {
  const res = await query<Record<string, string>>(
    `select sc.id, sc.tipo, sc.nome,
            to_char(sc.data_da,'YYYY-MM-DD') as data_da,
            to_char(sc.data_a,'YYYY-MM-DD')  as data_a,
            sc.blocca, sc.fonte_url, sc.fonte_citazione
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
  }));
}

export async function regoleConfermatePerCorso(corsoId: number): Promise<RegolaPubblica[]> {
  const res = await query<Record<string, unknown>>(
    `select id, tipo, testo, vincolante, fonte_url, fonte_citazione
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
  }));
}
