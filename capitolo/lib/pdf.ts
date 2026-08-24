// Estrae il testo da un PDF (compito ②→④): molte pagine d'ateneo non hanno le
// date nell'HTML, le tengono in un PDF allegato. Da qui il testo va poi al
// ritaglio e all'estrattore come qualunque altra fonte. [inv. 5]
//
// `pdf-parse` (e pdfjs) è pesante e fragile nel bundle serverless: lo importiamo
// in modo DINAMICO, solo quando c'è davvero un PDF da leggere. Così chi elabora
// una pagina HTML non carica mai questo modulo.

export async function estraiTestoPdf(corpo: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(corpo) });
  try {
    const res = await parser.getText();
    return res.text ?? '';
  } finally {
    await parser.destroy();
  }
}
