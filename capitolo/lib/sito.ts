// URL di base del sito, per sitemap e link assoluti. In produzione impostare
// SITE_URL (es. https://capitolo.it) fra le variabili d'ambiente su Vercel.
// Vercel espone anche VERCEL_URL (senza schema) come fallback.
export function urlBase(): string {
  const esplicito = process.env.SITE_URL;
  if (esplicito) return esplicito.replace(/\/+$/, '');
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`;
  return 'http://localhost:3000';
}
