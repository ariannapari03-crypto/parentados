import type { MetadataRoute } from 'next';
import { urlBase } from '@/lib/sito';

// robots.txt: le pagine pubbliche sono indicizzabili; gli strumenti da operatore
// (revisione, ricognizione) restano fuori dai motori di ricerca.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/revisione', '/ricognizione'],
    },
    sitemap: `${urlBase()}/sitemap.xml`,
  };
}
