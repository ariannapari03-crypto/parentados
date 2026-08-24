import { query } from './db';

// Elenco dei corsi presenti (scoperti dalla ricognizione), per l'interfaccia
// operatore «Elabora». Mostra quante regole (proposte o confermate) ha già.

export interface CorsoElaborabile {
  id: number;
  nome: string;
  ateneo_nome: string;
  url: string | null;
  regole: number;
}

export async function elencaCorsi(limite = 300): Promise<CorsoElaborabile[]> {
  const res = await query<Record<string, unknown>>(
    `select c.id, c.nome, a.nome as ateneo_nome, c.url_prova_finale as url,
            (select count(*) from regola r where r.corso_id = c.id) as regole
       from corso c
       join ateneo a on a.id = c.ateneo_id
      order by a.nome, c.nome
      limit $1`,
    [limite]
  );
  return res.rows.map((r) => ({
    id: Number(r.id as string),
    nome: r.nome as string,
    ateneo_nome: r.ateneo_nome as string,
    url: (r.url as string) ?? null,
    regole: Number(r.regole as string),
  }));
}
