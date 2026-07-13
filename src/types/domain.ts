export type Ruolo = 'nipote' | 'adulto'

export interface FamilyMember {
  id: string
  nome: string
  ruolo: Ruolo
}

export type Stagione = 'estate' | 'inverno'
export type SerrandaType = 'tapparelle' | 'simil-imposte' | 'nessuna'

export interface House {
  id: string
  slug: string
  nome: string
  hasGarage: boolean
  hasBoiler: boolean
  hasGas: boolean
  hasDeumidificatore: boolean
  hasTerrazzo: boolean
  serranda: SerrandaType
  supportsInverno: boolean
  genericChecklist: boolean // Sanremo: checklist unica, no stagionalità
  accessoRiservato: boolean // Sanremo: nipote solo se c'è un adulto nello stesso periodo
  sharedTaskGroupId: string | null // es. "erbacce-limone" per Limone 3/9
  infoGestione: HouseInfoSection[] // note pratiche fuori dalla checklist (gestione immondizia, impianti, ecc.)
}

export interface HouseInfoSection {
  titolo: string
  corpo: string
}

export interface Booking {
  id: string
  houseId: string
  dataInizio: string // ISO date (yyyy-mm-dd)
  dataFine: string
  partecipanti: string[] // FamilyMember id
  stagione: Stagione
  inizioStagione: boolean
  fineStagione: boolean
  createdBy: string
  createdAt: string
}

export type ChecklistFlow = 'pre-partenza' | 'apertura' | 'chiusura'

export interface ChecklistStepState {
  fatto: boolean
  da: string | null
  quando: string | null
  valore?: string | null
  foto?: string | null
}

export interface ChecklistState {
  id: string
  bookingId: string
  flow: ChecklistFlow
  steps: Record<string, ChecklistStepState>
  completatoQuando: string | null
}

export type HandoffStato = 'da_portare' | 'consegnato'

export interface HandoffItem {
  id: string
  houseId: string
  descrizione: string
  segnalatoDa: string
  dataSegnalazione: string
  stato: HandoffStato
  autoGenerato: boolean
  bookingOrigineId: string | null
}

export type IssueStato = 'aperto' | 'risolto'

export interface Issue {
  id: string
  houseId: string
  descrizione: string
  segnalatoDa: string
  data: string
  stato: IssueStato
}

export interface SharedTaskState {
  id: string // chiave, es. erbacce-limone-2026
  groupId: string // es. erbacce-limone
  anno: number
  fatto: boolean
  da: string | null
  quando: string | null
}
