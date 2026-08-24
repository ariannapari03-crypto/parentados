import { corsoPerId, idDaSlug, scadenzeConfermatePerDipartimento } from '@/lib/pubbliche';
import { generaIcs } from '@/lib/tesi';

export const dynamic = 'force-dynamic';

// Restituisce le scadenze del corso come file calendario .ics scaricabile.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const id = idDaSlug(slug);
  const corso = id == null ? null : await corsoPerId(id);
  if (!corso) return new Response('Corso non trovato', { status: 404 });

  const scadenze = corso.dipartimento_id
    ? await scadenzeConfermatePerDipartimento(corso.dipartimento_id)
    : [];
  const ics = generaIcs({ corsoNome: corso.nome, scadenze });

  return new Response(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="scadenze-${slug}.ics"`,
    },
  });
}
