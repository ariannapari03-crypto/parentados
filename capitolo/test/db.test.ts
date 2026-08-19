import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { query, chiudi } from '../lib/db';

// Test di lettura/scrittura del compito ①.
//
// È un test d'integrazione: richiede una DATABASE_URL con lo schema applicato
// (`npm run db:push`). Non chiama servizi esterni. Ogni caso ripulisce ciò che
// crea, sfruttando il cascade da `ateneo`.

async function creaAteneoDiProva(nome: string): Promise<number> {
  const res = await query<{ id: string }>(
    'insert into ateneo (nome) values ($1) returning id',
    [nome]
  );
  return Number(res.rows[0].id);
}

async function rimuoviAteneo(id: number): Promise<void> {
  await query('delete from ateneo where id = $1', [id]);
}

afterAll(async () => {
  await chiudi();
});

describe('schema e lettura/scrittura', () => {
  it('scrive e rilegge un ateneo', async () => {
    const id = await creaAteneoDiProva('Ateneo di prova');
    try {
      const res = await query<{ nome: string }>(
        'select nome from ateneo where id = $1',
        [id]
      );
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].nome).toBe('Ateneo di prova');
    } finally {
      await rimuoviAteneo(id);
    }
  });

  it("una scadenza nasce 'proposta' e accetta data mancante [inv. 1, 4]", async () => {
    const ateneoId = await creaAteneoDiProva('Ateneo scadenze');
    try {
      const dip = await query<{ id: string }>(
        'insert into dipartimento (ateneo_id, nome) values ($1, $2) returning id',
        [ateneoId, 'Dipartimento X']
      );
      const ses = await query<{ id: string }>(
        `insert into sessione (dipartimento_id, nome, anno_accademico)
         values ($1, $2, $3) returning id`,
        [Number(dip.rows[0].id), 'Sessione estiva', '2024/2025']
      );
      const sca = await query<{ stato: string; data_da: string | null }>(
        `insert into scadenza (sessione_id, tipo, data_da, fonte_url, fonte_citazione)
         values ($1, $2, null, $3, $4)
         returning stato, data_da`,
        [
          Number(ses.rows[0].id),
          'domanda_laurea',
          'https://esempio.it/prova-finale',
          'La domanda va presentata entro il mese precedente la seduta.',
        ]
      );
      expect(sca.rows[0].stato).toBe('proposta'); // default, non pubblico
      expect(sca.rows[0].data_da).toBeNull(); // lacuna ammessa, non stimata
    } finally {
      await rimuoviAteneo(ateneoId);
    }
  });

  it('una scadenza senza fonte viene rifiutata [inv. 2]', async () => {
    const ateneoId = await creaAteneoDiProva('Ateneo senza fonte');
    try {
      const dip = await query<{ id: string }>(
        'insert into dipartimento (ateneo_id, nome) values ($1, $2) returning id',
        [ateneoId, 'Dipartimento Y']
      );
      const ses = await query<{ id: string }>(
        `insert into sessione (dipartimento_id, nome, anno_accademico)
         values ($1, $2, $3) returning id`,
        [Number(dip.rows[0].id), 'Sessione autunnale', '2024/2025']
      );
      await expect(
        query(
          `insert into scadenza (sessione_id, tipo, fonte_url, fonte_citazione)
           values ($1, $2, null, null)`,
          [Number(ses.rows[0].id), 'consegna_tesi']
        )
      ).rejects.toThrow();
    } finally {
      await rimuoviAteneo(ateneoId);
    }
  });

  it("una regola nasce non vincolante e 'proposta' [inv. 4, 9]", async () => {
    const ateneoId = await creaAteneoDiProva('Ateneo regole');
    try {
      const corso = await query<{ id: string }>(
        'insert into corso (ateneo_id, nome) values ($1, $2) returning id',
        [ateneoId, 'Corso Z']
      );
      const reg = await query<{ vincolante: boolean; stato: string }>(
        `insert into regola (corso_id, testo, fonte_url, fonte_citazione)
         values ($1, $2, $3, $4)
         returning vincolante, stato`,
        [
          Number(corso.rows[0].id),
          'Lunghezza orientativa 50 pagine.',
          'https://esempio.it/regole',
          'La lunghezza orientativa dell’elaborato è di 50 pagine.',
        ]
      );
      expect(reg.rows[0].vincolante).toBe(false); // i consigli restano consigli
      expect(reg.rows[0].stato).toBe('proposta');
    } finally {
      await rimuoviAteneo(ateneoId);
    }
  });
});
