import type { ChecklistFlow, ChecklistState } from '../types/domain'

const KEY_STEP: Partial<Record<ChecklistFlow, string>> = {
  apertura: 'apertura-acqua',
  chiusura: 'chiusura-acqua',
}

/** Chi ha fisicamente aperto/chiuso l'acqua (prima/ultima azione del flusso) e quando. */
export function extractResponsible(state: ChecklistState | null | undefined): { da: string | null; quando: string | null } {
  if (!state) return { da: null, quando: null }
  const key = KEY_STEP[state.flow]
  const keyStep = key ? state.steps[key] : undefined
  if (keyStep?.fatto) return { da: keyStep.da, quando: keyStep.quando }
  // fallback: ultimo step completato per timestamp
  const done = Object.values(state.steps).filter((s) => s.fatto && s.quando)
  if (done.length === 0) return { da: null, quando: null }
  const last = done.sort((a, b) => (a.quando! < b.quando! ? 1 : -1))[0]
  return { da: last.da, quando: last.quando }
}
