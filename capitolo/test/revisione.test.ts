import 'dotenv/config';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { query, chiudi } from '../lib/db';
import {
  prossimeScadenze, prossimeRegole, contaProposte,
  confermaScadenza, scartaScadenza, correggiScadenza,
  confermaRegola, correggiRegola,
} from '../lib/revisione';
import {
  scadenzeConfermatePerDipartimento, regoleConfermatePerCorso,
} from '../lib/pubbliche';

// Compito ⑤: revisione. Verifica le transizioni di stato e — soprattutto — che
// nulla diventi pubblico finché una persona non conferma. [inv. 4]

let ateneoId = 0;
let dipartimentoId = 0;
let corsoId = 0;
let sessioneId = 0;
let sca: number[] = [];
let reg: number[] = [];

async function seed() {
  const a = await query<{ id: string }>("insert into ateneo (nome) values ('Ateneo rev') returning id");
  ateneoId = Number(a.rows[0].id);
  const d = await query<{ id: string }>('insert into dipartimento (ateneo_id, nome) values ($1,$2) returning id', [ateneoId, 'Dip. rev']);
  dipartimentoId = Number(d.rows[0].id);
  const c = await query<{ id: string }>('insert into corso (ateneo_id, dipartimento_id, nome) values ($1,$2,$3) returning id', [ateneoId, dipartimentoId, 'Corso rev']);
  corsoId = Number(c.rows[0].id);
  const s = await query<{ id: string }>('insert into sessione (dipartimento_id, nome, anno_accademico) values ($1,$2,$3) returning id', [dipartimentoId, 'Estiva', '2024/2025']);
  sessioneId = Number(s.rows[0].id);

  sca = [];
  for (const [tipo, data] of [['domanda_laurea', '2025-06-09'], ['consegna_tesi', '2025-06-23'], ['seduta', null]] as [string, string | null][]) {
    const r = await query<{ id: string }>(
      `insert into scadenza (sessione_id, tipo, data_da, fonte_url, fonte_citazione)
       values ($1,$2,$3,'https://x/f','citazione ' || $2) returning id`,
      [sessioneId, tipo, data]
    );
    sca.push(Number(r.rows[0].id));
  }
  reg = [];
  for (const [tipo, vinc] of [['lunghezza', false], ['formato', true]] as [string, boolean][]) {
    const r = await query<{ id: string }>(
      `insert into regola (corso_id, tipo, testo, vincolante, fonte_url, fonte_citazione)
       values ($1,$2,'testo','${vinc}',' https://x/r','cit') returning id`,
      [corsoId, tipo]
    );
    reg.push(Number(r.rows[0].id));
  }
}

beforeEach(async () => {
  if (ateneoId) await query('delete from ateneo where id=$1', [ateneoId]);
  await seed();
});

afterAll(async () => {
  if (ateneoId) await query('delete from ateneo where id=$1', [ateneoId]);
  await chiudi();
});

describe('coda di revisione', () => {
  it('elenca le proposte con il loro contesto e le date come YYYY-MM-DD', async () => {
    const prossime = await prossimeScadenze(500);
    const mie = prossime.filter((p) => p.dipartimento_nome === 'Dip. rev');
    expect(mie).toHaveLength(3);
    const domanda = mie.find((p) => p.tipo === 'domanda_laurea')!;
    expect(domanda.ateneo_nome).toBe('Ateneo rev');
    expect(domanda.sessione_nome).toBe('Estiva');
    expect(domanda.data_da).toBe('2025-06-09');
    // la lacuna resta lacuna
    expect(mie.find((p) => p.tipo === 'seduta')!.data_da).toBeNull();
  });

  it('conta le proposte in attesa', async () => {
    const c = await contaProposte();
    expect(c.scadenze).toBeGreaterThanOrEqual(3);
    expect(c.regole).toBeGreaterThanOrEqual(2);
  });
});

describe('niente è pubblico senza conferma [inv. 4]', () => {
  it('una proposta non compare nelle letture pubbliche', async () => {
    const pub = await scadenzeConfermatePerDipartimento(dipartimentoId);
    expect(pub).toHaveLength(0);
  });

  it('confermare la rende pubblica', async () => {
    await confermaScadenza(sca[0]);
    const pub = await scadenzeConfermatePerDipartimento(dipartimentoId);
    expect(pub.map((p) => p.id)).toContain(sca[0]);
  });

  it('scartare la toglie dalla coda e la tiene fuori dal pubblico', async () => {
    await scartaScadenza(sca[1]);
    const coda = (await prossimeScadenze(500)).map((p) => p.id);
    expect(coda).not.toContain(sca[1]);
    const pub = (await scadenzeConfermatePerDipartimento(dipartimentoId)).map((p) => p.id);
    expect(pub).not.toContain(sca[1]);
  });

  it('correggere = modificare e confermare in un colpo solo', async () => {
    await correggiScadenza(sca[2], { nome: 'Seduta di laurea', data_da: '2025-07-14' });
    const pub = await scadenzeConfermatePerDipartimento(dipartimentoId);
    const corretta = pub.find((p) => p.id === sca[2])!;
    expect(corretta.nome).toBe('Seduta di laurea');
    expect(corretta.data_da).toBe('2025-07-14'); // la lacuna è stata colmata a mano
  });
});

describe('regole', () => {
  it('confermare una regola la pubblica; la correzione può cambiare «vincolante» [inv. 9]', async () => {
    await confermaRegola(reg[0]); // lunghezza, non vincolante
    let pub = await regoleConfermatePerCorso(corsoId);
    expect(pub.map((r) => r.id)).toContain(reg[0]);
    expect(pub.find((r) => r.id === reg[0])!.vincolante).toBe(false);

    await correggiRegola(reg[1], { vincolante: false, testo: 'ora consiglio' });
    pub = await regoleConfermatePerCorso(corsoId);
    const r1 = pub.find((r) => r.id === reg[1])!;
    expect(r1.vincolante).toBe(false);
    expect(r1.testo).toBe('ora consiglio');
  });

  it('le proposte non confermate restano fuori dal pubblico [inv. 4]', async () => {
    const pub = await regoleConfermatePerCorso(corsoId);
    // reg[1] non è stata confermata in questo test
    expect(pub.map((r) => r.id)).not.toContain(reg[1]);
  });
});
