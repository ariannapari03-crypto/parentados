import type { Stagione } from '../types/domain'

export type StepKind = 'info' | 'confirm' | 'choice' | 'scorte' | 'note' | 'handoff-check' | 'shared-task'

export interface ChecklistCtx {
  stagione: Stagione
  inizioStagione: boolean
  fineStagione: boolean
}

export interface StepOption {
  value: string
  label: string
}

export interface StepDef {
  id: string
  label: string
  kind: StepKind
  emoji?: string
  options?: StepOption[]
  /** Mostra lo step solo se la funzione ritorna true, in base alle risposte date finora (id -> valore) */
  showIf?: (answers: Record<string, string | undefined>) => boolean
  allowPhoto?: boolean
  /** Effetto collaterale da eseguire quando lo step viene completato */
  effect?: 'create-handoff-lenzuola'
  freeText?: boolean
  /** Assunzione fatta per coerenza ma non esplicitamente confermata dall'utente (vedi spec, legenda [DA CONFERMARE]) */
  assunto?: boolean
  /** Per kind === 'shared-task': gruppo di case che condividono questa task (es. erbacce-limone) */
  sharedTaskGroupId?: string
}
