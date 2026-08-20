import type { MetadataRoute } from 'next';
import { corsiPubblicabili, slugCorso } from '@/lib/pubbliche';
import { urlBase } from '@/lib/sito';

// Sitemap: dà ai motori di ricerca l'elenco di tutte le pagine pubbliche, così
// vengono indicizzate. Include l'indice e una voce per corso.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = urlBase();
  const voci: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/corsi`, changeFrequency: 'weekly', priority: 0.8 },
  ];
  try {
    const corsi = await corsiPubblicabili();
    for (const c of corsi) {
      voci.push({
        url: `${base}/corso/${slugCorso(c)}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // Se il database non è raggiungibile in build, pubblichiamo almeno le
    // pagine statiche: meglio una sitemap parziale che un build fallito.
  }
  return voci;
}
