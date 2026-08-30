import { NextResponse } from 'next/server';
import { estraiTestoPdf } from '@/lib/pdf';
import { estraiStruttura } from '@/lib/modelli';

// I modelli: riceve un PDF, ne estrae SOLO la struttura e restituisce quella.
// Il testo del PDF non viene mai salvato né rispedito: si legge, si ricava
// l'ossatura, si butta. Nessuna frase del documento caricato lascia questa
// funzione.

export const runtime = 'nodejs'; // pdf-parse ha bisogno di Node
export const maxDuration = 60;

const LIMITE = 4.4 * 1024 * 1024; // margine sotto il limite di corpo di Vercel

export async function POST(req: Request) {
  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get('file') as File | null;
  } catch {
    return NextResponse.json({ errore: 'Caricamento non valido.' }, { status: 400 });
  }
  if (!file) return NextResponse.json({ errore: 'Nessun file.' }, { status: 400 });
  if (file.size > LIMITE) {
    return NextResponse.json(
      { errore: 'PDF troppo grande (max ~4 MB). Se è una scansione, esporta una versione più leggera.' },
      { status: 413 }
    );
  }

  try {
    const corpo = Buffer.from(await file.arrayBuffer());
    const testo = await estraiTestoPdf(corpo);
    const profilo = estraiStruttura(testo); // solo struttura, il testo resta qui e viene scartato
    return NextResponse.json({ nome: file.name, profilo });
  } catch {
    return NextResponse.json(
      { errore: 'Non sono riuscito a leggere il PDF (forse protetto o scansionato).' },
      { status: 422 }
    );
  }
}
