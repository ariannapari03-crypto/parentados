import { PDFParse } from 'pdf-parse';

// Estrae il testo da un PDF (compito ②→④): molte pagine d'ateneo non hanno le
// date nell'HTML, le tengono in un PDF allegato. Da qui il testo va poi al
// ritaglio e all'estrattore come qualunque altra fonte. [inv. 5]

export async function estraiTestoPdf(corpo: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(corpo) });
  try {
    const res = await parser.getText();
    return res.text ?? '';
  } finally {
    await parser.destroy();
  }
}
