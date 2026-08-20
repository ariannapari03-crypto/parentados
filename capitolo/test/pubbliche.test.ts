import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { query, chiudi } from '../lib/db';
import {
  slugifica, slugCorso, idDaSlug,
  corsiPubblicabili, corsoPerId,
  scadenzeConfermatePerDipartimento, regoleConfermatePerCorso, ultimaVerifica,
} from '../lib/pubbliche';

// Compito ⑥: pagine pubbliche. Verifica che escano SOLO dati confermati, che
// ogni affermazione porti la sua fonte, che le lacune restino visibili e che gli
// slug siano stabili e reversibili.

let ateneoId = 0;
let dipId = 0;
let corsoPieno = 0;   // ha dati confermati → pubblicabile
let corsoVuoto = 0;   // solo proposte → non pubblicabile
let sessioneId = 0;

beforeAll(async () => {
  const a = await query<{ id: string }>("insert into ateneo (nome) values ('Ateneo pub') returning id");
  ateneoId = Number(a.rows[0].id);
  const d = await query<{ id: string }>('insert into dipartimento (ateneo_id, nome) values ($1,$2) returning id', [ateneoId, 'Dip. pub']);
  dipId = Number(d.rows[0].id);
  const c1 = await query<{ id: string }>('insert into corso (ateneo_id, dipartimento_id, nome, livello) values ($1,$2,$3,$4) returning id', [ateneoId, dipId, 'Città e Politiche (LM)', 'LM']);
  corsoPieno = Number(c1.rows[0].id);
  // corsoVuoto sta in un dipartimento SENZA calendario confermato: così non ha
  // proprio nulla di pubblicabile (la sua unica regola è una proposta).
  const dv = await query<{ id: string }>('insert into dipartimento (ateneo_id, nome) values ($1,$2) returning id', [ateneoId, 'Dip. vuoto']);
  const dipVuoto = Number(dv.rows[0].id);
  const c2 = await query<{ id: string }>('insert into corso (ateneo_id, dipartimento_id, nome) values ($1,$2,$3) returning id', [ateneoId, dipVuoto, 'Corso solo proposte']);
  corsoVuoto = Number(c2.rows[0].id);
  const s = await query<{ id: string }>('insert into sessione (dipartimento_id, nome, anno_accademico) values ($1,$2,$3) returning id', [dipId, 'Estiva', '2024/2025']);
  sessioneId = Number(s.rows[0].id);

  // scadenza confermata (con data), scadenza confermata SENZA data (lacuna), e una proposta
  await query(
    `insert into scadenza (sessione_id, tipo, data_da, blocca, fonte_url, fonte_citazione, stato, confermato_il)
     values ($1,'domanda_laurea','2025-06-09',true,'https://x/f1','domanda entro il 09/06','confermata', now())`,
    [sessioneId]
  );
  await query(
    `insert into scadenza (sessione_id, tipo, data_da, fonte_url, fonte_citazione, stato, confermato_il)
     values ($1,'seduta',null,'https://x/f2','seduta a luglio','confermata', now())`,
    [sessioneId]
  );
  await query(
    `insert into scadenza (sessione_id, tipo, data_da, fonte_url, fonte_citazione, stato)
     values ($1,'consegna_tesi','2025-06-23','https://x/f3','consegna 23/06','proposta')`,
    [sessioneId]
  );
  // regola confermata su corsoPieno; proposta su corsoVuoto
  await query(
    `insert into regola (corso_id, tipo, testo, vincolante, fonte_url, fonte_citazione, stato, confermato_il)
     values ($1,'lunghezza','circa 50.000 parole', false,'https://x/r1','lunghezza orientativa','confermata', now())`,
    [corsoPieno]
  );
  await query(
    `insert into regola (corso_id, tipo, testo, vincolante, fonte_url, fonte_citazione, stato)
     values ($1,'formato','solo proposta', true,'https://x/r2','cit','proposta')`,
    [corsoVuoto]
  );
});

afterAll(async () => {
  if (ateneoId) await query('delete from ateneo where id=$1', [ateneoId]);
  await chiudi();
});

describe('slug', () => {
  it('slugifica togliendo accenti e simboli', () => {
    expect(slugifica('Città & Politiche (LM)!')).toBe('citta-politiche-lm');
  });
  it('slug del corso è reversibile', () => {
    const slug = slugCorso({ nome: 'Città e Politiche (LM)', id: 42 });
    expect(slug.endsWith('-42')).toBe(true);
    expect(idDaSlug(slug)).toBe(42);
  });
});

describe('elenco dei corsi pubblicabili', () => {
  it('include solo i corsi con dati confermati', async () => {
    const corsi = (await corsiPubblicabili()).filter((c) => c.ateneo_id === ateneoId);
    const ids = corsi.map((c) => c.id);
    expect(ids).toContain(corsoPieno);
    expect(ids).not.toContain(corsoVuoto);
  });
});

describe('letture pubbliche: solo confermati, con fonte [inv. 2, 4]', () => {
  it('le scadenze pubbliche sono solo confermate e portano la fonte', async () => {
    const sca = await scadenzeConfermatePerDipartimento(dipId);
    expect(sca).toHaveLength(2); // le due confermate, non la proposta
    for (const s of sca) {
      expect(s.fonte_url.length).toBeGreaterThan(0);
      expect(s.fonte_citazione.length).toBeGreaterThan(0);
    }
    // la lacuna resta lacuna, visibile
    expect(sca.find((s) => s.tipo === 'seduta')!.data_da).toBeNull();
    // la proposta non compare
    expect(sca.some((s) => s.tipo === 'consegna_tesi')).toBe(false);
  });

  it('le regole pubbliche sono solo confermate e portano la fonte', async () => {
    const reg = await regoleConfermatePerCorso(corsoPieno);
    expect(reg).toHaveLength(1);
    expect(reg[0].vincolante).toBe(false); // il consiglio resta consiglio [inv. 9]
    expect(reg[0].fonte_url.length).toBeGreaterThan(0);
    expect(reg[0].fonte_citazione.length).toBeGreaterThan(0);

    const vuote = await regoleConfermatePerCorso(corsoVuoto);
    expect(vuote).toHaveLength(0); // solo proposta → niente
  });

  it('la data di ultima verifica è la conferma più recente', async () => {
    const sca = await scadenzeConfermatePerDipartimento(dipId);
    const reg = await regoleConfermatePerCorso(corsoPieno);
    const v = ultimaVerifica(sca, reg);
    expect(v).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('corsoPerId restituisce il contesto del corso', async () => {
    const c = await corsoPerId(corsoPieno);
    expect(c?.nome).toBe('Città e Politiche (LM)');
    expect(c?.ateneo_nome).toBe('Ateneo pub');
    expect(c?.dipartimento_nome).toBe('Dip. pub');
  });
});
