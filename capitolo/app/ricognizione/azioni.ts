'use server';

import { cookies } from 'next/headers';
import { NOME_COOKIE, haAccesso } from '@/lib/auth';
import { ricognizioneAteneo } from '@/lib/ricognizione';
import { cercatoreAnthropic } from '@/lib/cercatore';

// Avvia la ricognizione per uno o più atenei scritti nel campo di testo (uno per
// riga). Ognuno viene cercato sul momento sul web. Operazione da operatore:
// richiede la sessione di revisione. [inv. 8: la chiave sta nell'ambiente]

export interface EsitoUi {
  righe: { ateneo: string; catalogo: string | null; scoperti: number; nuovi: number; errore?: string }[];
}

export async function avviaRicognizione(
  _prec: EsitoUi | undefined,
  formData: FormData
): Promise<EsitoUi> {
  const c = await cookies();
  if (!haAccesso(c.get(NOME_COOKIE)?.value)) {
    return { righe: [{ ateneo: '', catalogo: null, scoperti: 0, nuovi: 0, errore: 'Non autorizzato.' }] };
  }

  const testo = String(formData.get('atenei') ?? '');
  const nomi = testo.split('\n').map((s) => s.trim()).filter(Boolean);
  if (nomi.length === 0) return { righe: [] };

  const cerca = cercatoreAnthropic();
  const righe: EsitoUi['righe'] = [];
  for (const nome of nomi) {
    try {
      const esito = await ricognizioneAteneo(nome, { cerca });
      righe.push({ ateneo: nome, catalogo: esito.catalogoUrl, scoperti: esito.scoperti.length, nuovi: esito.nuovi });
    } catch (e) {
      righe.push({ ateneo: nome, catalogo: null, scoperti: 0, nuovi: 0, errore: (e as Error).message });
    }
  }
  return { righe };
}
