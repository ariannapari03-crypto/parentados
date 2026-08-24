'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { NOME_COOKIE, haAccesso } from '@/lib/auth';
import { clienteAnthropic } from '@/lib/estrattore';
import { elaboraRegoleCorso } from '@/lib/pipeline';

// Elabora un corso: scarica la sua pagina, ritaglia, estrae le regole come
// proposte. Operazione da operatore (richiede la sessione). La chiave del
// modello è solo nell'ambiente. [inv. 8]

export interface EsitoElab {
  ok: boolean;
  messaggio: string;
}

export async function azElaboraCorso(corsoId: number): Promise<EsitoElab> {
  const c = await cookies();
  if (!haAccesso(c.get(NOME_COOKIE)?.value)) {
    return { ok: false, messaggio: 'Sessione scaduta: rientra dalla revisione.' };
  }
  try {
    const e = await elaboraRegoleCorso(corsoId, {
      cliente: clienteAnthropic('claude-sonnet-5'),
    });
    revalidatePath('/elabora');
    const parole =
      e.regoleInserite > 0
        ? `${e.regoleInserite} regole proposte (scartate ${e.scartate}). Vai in revisione per confermarle.`
        : `nessuna regola estratta (esito ${e.esito}). La pagina potrebbe non contenere le regole, o essere resa via JavaScript.`;
    return { ok: true, messaggio: `Scaricati ${e.documentiScaricati} documenti; ${parole}` };
  } catch (err) {
    return { ok: false, messaggio: (err as Error).message };
  }
}
