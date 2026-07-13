import { supabase } from './supabase'
import type {
  Booking,
  ChecklistFlow,
  ChecklistState,
  ChecklistStepState,
  FamilyMember,
  HandoffItem,
  HandoffStato,
  Issue,
  Ruolo,
  SharedTaskState,
  Stagione,
} from '../types/domain'

// --- family_members ---

interface FamilyMemberRow {
  id: string
  nome: string
  ruolo: Ruolo
}

function mapFamilyMember(row: FamilyMemberRow): FamilyMember {
  return { id: row.id, nome: row.nome, ruolo: row.ruolo }
}

export async function listFamilyMembers(): Promise<FamilyMember[]> {
  const { data, error } = await supabase.from('family_members').select('id, nome, ruolo').order('nome')
  if (error) throw error
  return (data as FamilyMemberRow[]).map(mapFamilyMember)
}

export async function addFamilyMember(nome: string, ruolo: Ruolo): Promise<FamilyMember> {
  const { data, error } = await supabase.from('family_members').insert({ nome, ruolo }).select().single()
  if (error) throw error
  return mapFamilyMember(data as FamilyMemberRow)
}

export async function removeFamilyMember(id: string): Promise<void> {
  const { error } = await supabase.from('family_members').delete().eq('id', id)
  if (error) throw error
}

// --- bookings ---

interface BookingRow {
  id: string
  house_id: string
  data_inizio: string
  data_fine: string
  partecipanti: string[]
  stagione: Stagione
  inizio_stagione: boolean
  fine_stagione: boolean
  created_by: string | null
  created_at: string
}

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    houseId: row.house_id,
    dataInizio: row.data_inizio,
    dataFine: row.data_fine,
    partecipanti: row.partecipanti ?? [],
    stagione: row.stagione,
    inizioStagione: row.inizio_stagione,
    fineStagione: row.fine_stagione,
    createdBy: row.created_by ?? '',
    createdAt: row.created_at,
  }
}

export async function listBookings(): Promise<Booking[]> {
  const { data, error } = await supabase.from('bookings').select('*').order('data_inizio')
  if (error) throw error
  return (data as BookingRow[]).map(mapBooking)
}

export async function getBooking(id: string): Promise<Booking | null> {
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapBooking(data as BookingRow) : null
}

export async function listBookingsForHouse(houseId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('house_id', houseId)
    .order('data_inizio')
  if (error) throw error
  return (data as BookingRow[]).map(mapBooking)
}

export interface OverlapError {
  type: 'overlap'
  conflictingBooking: Booking
}

export interface SanremoAccessError {
  type: 'sanremo-access'
}

export async function findOverlappingBooking(
  houseId: string,
  dataInizio: string,
  dataFine: string,
  excludeBookingId?: string,
): Promise<Booking | null> {
  const existing = await listBookingsForHouse(houseId)
  const start = new Date(dataInizio).getTime()
  const end = new Date(dataFine).getTime()
  for (const bk of existing) {
    if (excludeBookingId && bk.id === excludeBookingId) continue
    const bkStart = new Date(bk.dataInizio).getTime()
    const bkEnd = new Date(bk.dataFine).getTime()
    // Sovrapposizione reale: un soggiorno che chiude il giorno in cui l'altro apre NON è conflitto (spec 4.1).
    const overlaps = start < bkEnd && end > bkStart
    if (overlaps) return bk
  }
  return null
}

export async function createBooking(input: {
  houseId: string
  dataInizio: string
  dataFine: string
  partecipanti: string[]
  stagione: Stagione
  inizioStagione: boolean
  fineStagione: boolean
  createdBy: string
}): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      house_id: input.houseId,
      data_inizio: input.dataInizio,
      data_fine: input.dataFine,
      partecipanti: input.partecipanti,
      stagione: input.stagione,
      inizio_stagione: input.inizioStagione,
      fine_stagione: input.fineStagione,
      created_by: input.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return mapBooking(data as BookingRow)
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw error
}

// --- checklist_states ---

interface ChecklistStateRow {
  id: string
  booking_id: string
  flow: ChecklistFlow
  steps: Record<string, ChecklistStepState>
  completato_quando: string | null
}

function mapChecklistState(row: ChecklistStateRow): ChecklistState {
  return {
    id: row.id,
    bookingId: row.booking_id,
    flow: row.flow,
    steps: row.steps ?? {},
    completatoQuando: row.completato_quando,
  }
}

export async function getChecklistState(bookingId: string, flow: ChecklistFlow): Promise<ChecklistState | null> {
  const { data, error } = await supabase
    .from('checklist_states')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('flow', flow)
    .maybeSingle()
  if (error) throw error
  return data ? mapChecklistState(data as ChecklistStateRow) : null
}

export async function upsertChecklistStep(
  bookingId: string,
  flow: ChecklistFlow,
  stepId: string,
  stepState: ChecklistStepState,
): Promise<ChecklistState> {
  const existing = await getChecklistState(bookingId, flow)
  const steps = { ...(existing?.steps ?? {}), [stepId]: stepState }
  const { data, error } = await supabase
    .from('checklist_states')
    .upsert({ booking_id: bookingId, flow, steps }, { onConflict: 'booking_id,flow' })
    .select()
    .single()
  if (error) throw error
  return mapChecklistState(data as ChecklistStateRow)
}

export async function markChecklistCompleted(bookingId: string, flow: ChecklistFlow): Promise<void> {
  const { error } = await supabase
    .from('checklist_states')
    .update({ completato_quando: new Date().toISOString() })
    .eq('booking_id', bookingId)
    .eq('flow', flow)
  if (error) throw error
}

// --- handoff_items ---

interface HandoffItemRow {
  id: string
  house_id: string
  descrizione: string
  segnalato_da: string
  data_segnalazione: string
  stato: HandoffStato
  auto_generato: boolean
  booking_origine_id: string | null
}

function mapHandoffItem(row: HandoffItemRow): HandoffItem {
  return {
    id: row.id,
    houseId: row.house_id,
    descrizione: row.descrizione,
    segnalatoDa: row.segnalato_da,
    dataSegnalazione: row.data_segnalazione,
    stato: row.stato,
    autoGenerato: row.auto_generato,
    bookingOrigineId: row.booking_origine_id,
  }
}

export async function listHandoffItems(houseId?: string): Promise<HandoffItem[]> {
  let query = supabase.from('handoff_items').select('*').order('data_segnalazione', { ascending: false })
  if (houseId) query = query.eq('house_id', houseId)
  const { data, error } = await query
  if (error) throw error
  return (data as HandoffItemRow[]).map(mapHandoffItem)
}

export async function createHandoffItem(input: {
  houseId: string
  descrizione: string
  segnalatoDa: string
  autoGenerato?: boolean
  bookingOrigineId?: string
}): Promise<HandoffItem> {
  const { data, error } = await supabase
    .from('handoff_items')
    .insert({
      house_id: input.houseId,
      descrizione: input.descrizione,
      segnalato_da: input.segnalatoDa,
      auto_generato: input.autoGenerato ?? false,
      booking_origine_id: input.bookingOrigineId ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return mapHandoffItem(data as HandoffItemRow)
}

export async function markHandoffDelivered(id: string): Promise<void> {
  const { error } = await supabase.from('handoff_items').update({ stato: 'consegnato' }).eq('id', id)
  if (error) throw error
}

// --- issues ---

interface IssueRow {
  id: string
  house_id: string
  descrizione: string
  segnalato_da: string
  data: string
  stato: 'aperto' | 'risolto'
}

function mapIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    houseId: row.house_id,
    descrizione: row.descrizione,
    segnalatoDa: row.segnalato_da,
    data: row.data,
    stato: row.stato,
  }
}

export async function listIssues(houseId?: string): Promise<Issue[]> {
  let query = supabase.from('issues').select('*').order('data', { ascending: false })
  if (houseId) query = query.eq('house_id', houseId)
  const { data, error } = await query
  if (error) throw error
  return (data as IssueRow[]).map(mapIssue)
}

export async function createIssue(input: { houseId: string; descrizione: string; segnalatoDa: string }): Promise<Issue> {
  const { data, error } = await supabase
    .from('issues')
    .insert({ house_id: input.houseId, descrizione: input.descrizione, segnalato_da: input.segnalatoDa })
    .select()
    .single()
  if (error) throw error
  return mapIssue(data as IssueRow)
}

export async function resolveIssue(id: string): Promise<void> {
  const { error } = await supabase.from('issues').update({ stato: 'risolto' }).eq('id', id)
  if (error) throw error
}

// --- shared_task_states ---

interface SharedTaskStateRow {
  id: string
  group_id: string
  anno: number
  fatto: boolean
  da: string | null
  quando: string | null
}

function mapSharedTaskState(row: SharedTaskStateRow): SharedTaskState {
  return { id: row.id, groupId: row.group_id, anno: row.anno, fatto: row.fatto, da: row.da, quando: row.quando }
}

export async function getSharedTaskState(groupId: string, anno: number): Promise<SharedTaskState | null> {
  const id = `${groupId}-${anno}`
  const { data, error } = await supabase.from('shared_task_states').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapSharedTaskState(data as SharedTaskStateRow) : null
}

export async function setSharedTaskDone(groupId: string, anno: number, da: string): Promise<SharedTaskState> {
  const id = `${groupId}-${anno}`
  const { data, error } = await supabase
    .from('shared_task_states')
    .upsert({ id, group_id: groupId, anno, fatto: true, da, quando: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return mapSharedTaskState(data as SharedTaskStateRow)
}
