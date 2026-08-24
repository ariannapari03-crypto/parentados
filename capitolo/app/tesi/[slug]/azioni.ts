'use server';

import { idDaSlug, corsoPerId, regoleConfermatePerCorso } from '@/lib/pubbliche';
import { clienteAnthropic } from '@/lib/estrattore';

// Assistente di scrittura della tesi: usa come contesto le REGOLE CONFERMATE del
// corso. È aiuto generativo (scaletta, riscrittura, chiarezza, bibliografia), non
// estrazione di dati: ma non deve inventare regole o scadenze del corso — se una
// cosa non è tra le regole note, lo dice e invita a verificare la fonte.

export interface RispostaAssistente {
  testo?: string;
  errore?: string;
}

export async function assistenteScrittura(
  slug: string,
  richiesta: string
): Promise<RispostaAssistente> {
  const domanda = richiesta.trim();
  if (!domanda) return { errore: 'Scrivi cosa ti serve.' };

  const id = idDaSlug(slug);
  const corso = id == null ? null : await corsoPerId(id);
  if (!corso) return { errore: 'Corso non trovato.' };

  const regole = await regoleConfermatePerCorso(corso.id);
  const contestoRegole =
    regole.length > 0
      ? regole
          .map((r) => `- (${r.vincolante ? 'vincolante' : 'indicazione'}) ${r.testo}`)
          .join('\n')
      : '(nessuna regola confermata per questo corso: non darne per certe)';

  const sistema =
    `Sei un assistente per la stesura della tesi di uno studente del corso ` +
    `"${corso.nome}"${corso.ateneo_nome ? ` (${corso.ateneo_nome})` : ''}.\n` +
    `Aiuti con: scaletta/struttura, riscrittura e chiarezza, impostazione della ` +
    `bibliografia e delle citazioni, consigli di metodo.\n` +
    `Regole note del corso (usa SOLO queste come vincoli del corso):\n${contestoRegole}\n\n` +
    `Non inventare regole, lunghezze o scadenze del corso non elencate sopra: se ` +
    `servono, dì di verificarle sulla pagina ufficiale del corso. Le indicazioni ` +
    `orientative restano consigli, non obblighi. Rispondi in italiano, conciso e pratico.`;

  try {
    const cliente = clienteAnthropic('claude-sonnet-5');
    const r = await cliente.completa({ sistema, utente: domanda });
    return { testo: r.testo };
  } catch (e) {
    return { errore: (e as Error).message };
  }
}
