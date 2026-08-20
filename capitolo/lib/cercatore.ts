import Anthropic from '@anthropic-ai/sdk';
import type { Cercatore, RisultatoRicerca } from './ricognizione';

// Cercatore di produzione: usa lo strumento server-side `web_search` del modello
// per cercare l'ateneo SUL MOMENTO sul web. I risultati sono URL reali restituiti
// dalla ricerca, non inventati dal modello. La chiave si legge solo
// dall'ambiente (ANTHROPIC_API_KEY). [inv. 8]
//
// Nota: `web_search` gira sull'infrastruttura di Anthropic, quindi funziona anche
// dove il fetch diretto verso i siti degli atenei è filtrato. Richiede però una
// chiave API e rete verso l'API: non è esercitabile in ambienti senza chiave.

// Sonnet (rapido) basta per trovare un catalogo: non serve Opus. Effort basso e
// poche ricerche tengono la latenza bassa. Timeout esplicito per non restare
// appesi. La ricerca deve restare veloce: è solo per trovare le URL giuste.
export function cercatoreAnthropic(modello = 'claude-sonnet-5'): Cercatore {
  const client = new Anthropic({ timeout: 40_000, maxRetries: 1 });
  return async (query: string): Promise<RisultatoRicerca[]> => {
    // Campi come `tools` server-side possono non essere tipizzati nell'SDK:
    // costruiamo i parametri senza vincolo di tipo.
    const parametri: Record<string, unknown> = {
      model: modello,
      max_tokens: 700,
      output_config: { effort: 'low' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 2 }],
      messages: [
        {
          role: 'user',
          content:
            `Fai UNA ricerca web per trovare la pagina di catalogo dei corsi di ` +
            `laurea di: "${query}". Restituisci le pagine ufficiali dell'ateneo, ` +
            `senza commenti.`,
        },
      ],
    };
    const risposta = await client.messages.create(
      parametri as unknown as Anthropic.MessageCreateParamsNonStreaming
    );

    const risultati: RisultatoRicerca[] = [];
    const visti = new Set<string>();
    for (const blocco of risposta.content as unknown[]) {
      const b = blocco as { type?: string; content?: unknown };
      if (b.type !== 'web_search_tool_result' || !Array.isArray(b.content)) continue;
      for (const voce of b.content as Array<Record<string, unknown>>) {
        if (voce.type === 'web_search_result' && typeof voce.url === 'string') {
          if (visti.has(voce.url)) continue;
          visti.add(voce.url);
          risultati.push({
            titolo: typeof voce.title === 'string' ? voce.title : voce.url,
            url: voce.url,
          });
        }
      }
    }
    return risultati;
  };
}
