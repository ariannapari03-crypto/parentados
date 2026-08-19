'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { ScadenzaDaRevisionare, RegolaDaRevisionare } from '@/lib/revisione';
import {
  azConfermaScadenza, azScartaScadenza, azCorreggiScadenza,
  azConfermaRegola, azScartaRegola, azCorreggiRegola,
} from './azioni';

type Voce =
  | { kind: 'scadenza'; data: ScadenzaDaRevisionare }
  | { kind: 'regola'; data: RegolaDaRevisionare };

type Stato = 'confermata' | 'scartata' | 'corretta';

const chiave = (v: Voce) => `${v.kind}-${v.data.id}`;

export function Revisore({
  scadenze,
  regole,
  conteggi,
}: {
  scadenze: ScadenzaDaRevisionare[];
  regole: RegolaDaRevisionare[];
  conteggi: { scadenze: number; regole: number };
}) {
  const voci = useMemo<Voce[]>(
    () => [
      ...scadenze.map((data) => ({ kind: 'scadenza' as const, data })),
      ...regole.map((data) => ({ kind: 'regola' as const, data })),
    ],
    [scadenze, regole]
  );

  const [indice, setIndice] = useState(0);
  const [fatti, setFatti] = useState<Record<string, Stato>>({});
  const [modifica, setModifica] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, startTransition] = useTransition();

  const voce = voci[indice];
  const totale = voci.length;
  const completati = Object.keys(fatti).length;
  const confermate = Object.values(fatti).filter((s) => s !== 'scartata').length;

  const avanza = useCallback(() => {
    setModifica(false);
    setIndice((i) => Math.min(i + 1, totale - 1));
  }, [totale]);

  const segna = useCallback((v: Voce, stato: Stato) => {
    setFatti((f) => ({ ...f, [chiave(v)]: stato }));
  }, []);

  const conferma = useCallback(
    (v: Voce) => {
      segna(v, 'confermata');
      avanza();
      startTransition(async () => {
        try {
          if (v.kind === 'scadenza') await azConfermaScadenza(v.data.id);
          else await azConfermaRegola(v.data.id);
        } catch (e) {
          setErrore((e as Error).message);
        }
      });
    },
    [segna, avanza]
  );

  const scarta = useCallback(
    (v: Voce) => {
      segna(v, 'scartata');
      avanza();
      startTransition(async () => {
        try {
          if (v.kind === 'scadenza') await azScartaScadenza(v.data.id);
          else await azScartaRegola(v.data.id);
        } catch (e) {
          setErrore((e as Error).message);
        }
      });
    },
    [segna, avanza]
  );

  // Scorciatoie da tastiera globali (disattive mentre si modifica).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (modifica) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!voce) return;
      switch (e.key.toLowerCase()) {
        case 'c': e.preventDefault(); conferma(voce); break;
        case 's': e.preventDefault(); scarta(voce); break;
        case 'e': e.preventDefault(); setModifica(true); break;
        case 'arrowright': case 'j': e.preventDefault(); setIndice((i) => Math.min(i + 1, totale - 1)); break;
        case 'arrowleft': case 'k': e.preventDefault(); setIndice((i) => Math.max(i - 1, 0)); break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [voce, modifica, conferma, scarta, totale]);

  if (totale === 0) {
    return (
      <main style={S.main}>
        <h1>Revisione</h1>
        <p>Nessuna proposta in attesa. Tutto revisionato. 🎉</p>
      </main>
    );
  }

  const statoCorrente = voce ? fatti[chiave(voce)] : undefined;

  return (
    <main style={S.main}>
      <header style={S.header}>
        <strong>Revisione</strong>
        <span style={S.progress}>
          {indice + 1} / {totale} · fatte {completati} (confermate {confermate}) ·
          in coda: {conteggi.scadenze} scadenze, {conteggi.regole} regole
        </span>
      </header>

      {errore && <p style={S.errore}>Errore: {errore}</p>}

      {voce ? (
        <>
          <div style={{ ...S.card, opacity: statoCorrente ? 0.55 : 1 }}>
            {statoCorrente && <div style={S.badge}>{statoCorrente}</div>}
            {voce.kind === 'scadenza'
              ? <VistaScadenza v={voce.data} />
              : <VistaRegola v={voce.data} />}
            {modifica && (
              <FormModifica
                voce={voce}
                onAnnulla={() => setModifica(false)}
                onSalva={(patch) => {
                  segna(voce, 'corretta');
                  setModifica(false);
                  avanza();
                  startTransition(async () => {
                    try {
                      if (voce.kind === 'scadenza') await azCorreggiScadenza(voce.data.id, patch);
                      else await azCorreggiRegola(voce.data.id, patch as never);
                    } catch (e) {
                      setErrore((e as Error).message);
                    }
                  });
                }}
              />
            )}
          </div>

          <div style={S.azioni}>
            <button style={S.btnConferma} onClick={() => conferma(voce)}>Conferma <kbd>C</kbd></button>
            <button style={S.btnScarta} onClick={() => scarta(voce)}>Scarta <kbd>S</kbd></button>
            <button style={S.btn} onClick={() => setModifica((m) => !m)}>Modifica <kbd>E</kbd></button>
            <span style={{ flex: 1 }} />
            <button style={S.btn} onClick={() => setIndice((i) => Math.max(i - 1, 0))}>◀ <kbd>K</kbd></button>
            <button style={S.btn} onClick={() => setIndice((i) => Math.min(i + 1, totale - 1))}><kbd>J</kbd> ▶</button>
          </div>
          <p style={S.hint}>
            Tastiera: <kbd>C</kbd> conferma · <kbd>S</kbd> scarta · <kbd>E</kbd> modifica ·
            <kbd>J</kbd>/<kbd>K</kbd> o frecce per scorrere. {inCorso && '· salvataggio…'}
          </p>
        </>
      ) : null}
    </main>
  );
}

function Fonte({ url, citazione }: { url: string; citazione: string }) {
  return (
    <div style={S.fonte}>
      <div style={{ fontStyle: 'italic' }}>&ldquo;{citazione}&rdquo;</div>
      <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>{url}</a>
    </div>
  );
}

function VistaScadenza({ v }: { v: ScadenzaDaRevisionare }) {
  return (
    <>
      <div style={S.contesto}>{v.ateneo_nome} · {v.dipartimento_nome} · {v.sessione_nome} · a.a. {v.anno_accademico}</div>
      <h2 style={S.titolo}>{v.nome ?? v.tipo} {v.blocca && <span style={S.perentoria}>perentoria</span>}</h2>
      <div style={S.riga}><span style={S.et}>tipo</span> {v.tipo}</div>
      <div style={S.riga}><span style={S.et}>data</span> {v.data_da ?? <em style={{ color: '#b45309' }}>lacuna (non pubblicata)</em>}{v.data_a ? ` – ${v.data_a}` : ''}</div>
      {v.confidenza != null && <div style={S.riga}><span style={S.et}>confidenza</span> {(v.confidenza * 100).toFixed(0)}%</div>}
      <Fonte url={v.fonte_url} citazione={v.fonte_citazione} />
    </>
  );
}

function VistaRegola({ v }: { v: RegolaDaRevisionare }) {
  return (
    <>
      <div style={S.contesto}>{v.ateneo_nome} · {v.corso_nome}</div>
      <h2 style={S.titolo}>{v.tipo ?? 'regola'} {v.vincolante ? <span style={S.perentoria}>vincolante</span> : <span style={S.consiglio}>consiglio</span>}</h2>
      <div style={S.riga}>{v.testo}</div>
      {v.confidenza != null && <div style={S.riga}><span style={S.et}>confidenza</span> {(v.confidenza * 100).toFixed(0)}%</div>}
      <Fonte url={v.fonte_url} citazione={v.fonte_citazione} />
    </>
  );
}

function FormModifica({
  voce,
  onSalva,
  onAnnulla,
}: {
  voce: Voce;
  onSalva: (patch: Record<string, unknown>) => void;
  onAnnulla: () => void;
}) {
  const primo = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  useEffect(() => { primo.current?.focus(); }, []);

  function onKeyForm(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); onAnnulla(); }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).closest('form')?.requestSubmit();
    }
  }

  if (voce.kind === 'scadenza') {
    const d = voce.data;
    return (
      <form
        style={S.form}
        onKeyDown={onKeyForm}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          onSalva({
            tipo: String(f.get('tipo') ?? ''),
            nome: (String(f.get('nome') ?? '') || null),
            data_da: (String(f.get('data_da') ?? '') || null),
            data_a: (String(f.get('data_a') ?? '') || null),
            blocca: f.get('blocca') === 'on',
            fonte_citazione: String(f.get('fonte_citazione') ?? ''),
          });
        }}
      >
        <L t="tipo"><input ref={primo as never} name="tipo" defaultValue={d.tipo} style={S.input} /></L>
        <L t="nome"><input name="nome" defaultValue={d.nome ?? ''} style={S.input} /></L>
        <L t="data_da"><input type="date" name="data_da" defaultValue={d.data_da ?? ''} style={S.input} /></L>
        <L t="data_a"><input type="date" name="data_a" defaultValue={d.data_a ?? ''} style={S.input} /></L>
        <L t="perentoria"><input type="checkbox" name="blocca" defaultChecked={d.blocca} /></L>
        <L t="fonte_citazione"><textarea name="fonte_citazione" defaultValue={d.fonte_citazione} style={S.textarea} /></L>
        <BottoniForm onAnnulla={onAnnulla} />
      </form>
    );
  }

  const d = voce.data;
  return (
    <form
      style={S.form}
      onKeyDown={onKeyForm}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSalva({
          tipo: (String(f.get('tipo') ?? '') || null),
          testo: String(f.get('testo') ?? ''),
          vincolante: f.get('vincolante') === 'on',
          fonte_citazione: String(f.get('fonte_citazione') ?? ''),
        });
      }}
    >
      <L t="tipo"><input ref={primo as never} name="tipo" defaultValue={d.tipo ?? ''} style={S.input} /></L>
      <L t="testo"><textarea name="testo" defaultValue={d.testo} style={S.textarea} /></L>
      <L t="vincolante"><input type="checkbox" name="vincolante" defaultChecked={d.vincolante} /></L>
      <L t="fonte_citazione"><textarea name="fonte_citazione" defaultValue={d.fonte_citazione} style={S.textarea} /></L>
      <BottoniForm onAnnulla={onAnnulla} />
    </form>
  );
}

function L({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <label style={S.label}>
      <span style={S.et}>{t}</span>
      {children}
    </label>
  );
}

function BottoniForm({ onAnnulla }: { onAnnulla: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button type="submit" style={S.btnConferma}>Salva e conferma <kbd>⌘⏎</kbd></button>
      <button type="button" style={S.btn} onClick={onAnnulla}>Annulla <kbd>Esc</kbd></button>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: { maxWidth: 720, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif', color: '#111' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, gap: 12, flexWrap: 'wrap' },
  progress: { fontSize: 13, color: '#555' },
  errore: { background: '#fef2f2', color: '#b91c1c', padding: 8, borderRadius: 6 },
  card: { border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginTop: 16, position: 'relative', background: '#fff' },
  badge: { position: 'absolute', top: 10, right: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#059669' },
  contesto: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  titolo: { margin: '2px 0 10px', fontSize: 20 },
  riga: { margin: '4px 0', fontSize: 15 },
  et: { display: 'inline-block', minWidth: 110, color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  perentoria: { fontSize: 12, color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 4, padding: '1px 6px', marginLeft: 6 },
  consiglio: { fontSize: 12, color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 6px', marginLeft: 6 },
  fonte: { marginTop: 12, padding: 10, background: '#f9fafb', borderRadius: 6, borderLeft: '3px solid #d1d5db' },
  azioni: { display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' },
  hint: { marginTop: 10, fontSize: 12, color: '#6b7280' },
  btn: { padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' },
  btnConferma: { padding: '8px 12px', borderRadius: 6, border: '1px solid #059669', background: '#ecfdf5', color: '#065f46', cursor: 'pointer', fontWeight: 600 },
  btnScarta: { padding: '8px 12px', borderRadius: 6, border: '1px solid #dc2626', background: '#fef2f2', color: '#991b1b', cursor: 'pointer', fontWeight: 600 },
  form: { marginTop: 14, borderTop: '1px dashed #e5e7eb', paddingTop: 12, display: 'grid', gap: 8 },
  label: { display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', gap: 8 },
  input: { padding: 6, border: '1px solid #d1d5db', borderRadius: 4 },
  textarea: { padding: 6, border: '1px solid #d1d5db', borderRadius: 4, minHeight: 60, fontFamily: 'inherit' },
};
