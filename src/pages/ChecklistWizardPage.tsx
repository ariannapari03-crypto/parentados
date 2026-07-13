import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getHouseById } from '../data/houses'
import { getChecklistSteps } from '../data/checklists'
import type { StepDef } from '../data/checklistTypes'
import { useFamily } from '../context/FamilyContext'
import {
  createHandoffItem,
  getBooking,
  getChecklistState,
  getSharedTaskState,
  listHandoffItems,
  markChecklistCompleted,
  markHandoffDelivered,
  setSharedTaskDone,
  upsertChecklistStep,
} from '../lib/repo'
import type { Booking, ChecklistFlow, ChecklistStepState, HandoffItem, SharedTaskState } from '../types/domain'
import { compressImage } from '../lib/imageCompress'
import { formatDateRange } from '../lib/dateUtils'

function useBooking(bookingId: string | undefined) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!bookingId) return
    setLoading(true)
    getBooking(bookingId).then((b) => {
      setBooking(b)
      setLoading(false)
    })
  }, [bookingId])
  return { booking, loading }
}

export default function ChecklistWizardPage() {
  const { bookingId, flow } = useParams<{ bookingId: string; flow: ChecklistFlow }>()
  const { currentMember } = useFamily()
  const { booking, loading: loadingBooking } = useBooking(bookingId)
  const house = booking ? getHouseById(booking.houseId) : undefined

  const [stepStates, setStepStates] = useState<Record<string, ChecklistStepState>>({})
  const [loadingSteps, setLoadingSteps] = useState(true)
  const [pendingFoto, setPendingFoto] = useState<string | null>(null)
  const [freeTextValue, setFreeTextValue] = useState('')
  const [handoffItems, setHandoffItems] = useState<HandoffItem[]>([])
  const [sharedState, setSharedState] = useState<SharedTaskState | null>(null)

  const steps: StepDef[] = useMemo(() => {
    if (!house || !booking || !flow) return []
    return getChecklistSteps(house, flow, {
      stagione: booking.stagione,
      inizioStagione: booking.inizioStagione,
      fineStagione: booking.fineStagione,
    })
  }, [house, booking, flow])

  useEffect(() => {
    if (!bookingId || !flow) return
    setLoadingSteps(true)
    getChecklistState(bookingId, flow).then((state) => {
      setStepStates(state?.steps ?? {})
      setLoadingSteps(false)
    })
  }, [bookingId, flow])

  const answers = useMemo(
    () => Object.fromEntries(Object.entries(stepStates).map(([k, v]) => [k, v.valore ?? undefined])),
    [stepStates],
  )

  const visibleSteps = useMemo(() => steps.filter((s) => !s.showIf || s.showIf(answers)), [steps, answers])
  const currentIndex = visibleSteps.findIndex((s) => !stepStates[s.id]?.fatto)
  const currentStep = currentIndex === -1 ? null : visibleSteps[currentIndex]

  useEffect(() => {
    setPendingFoto(null)
    setFreeTextValue('')
  }, [currentStep?.id])

  useEffect(() => {
    if (!house || !currentStep || currentStep.kind !== 'handoff-check') return
    listHandoffItems(house.id).then((items) => setHandoffItems(items.filter((i) => i.stato === 'da_portare')))
  }, [house, currentStep])

  useEffect(() => {
    if (!currentStep || currentStep.kind !== 'shared-task' || !currentStep.sharedTaskGroupId || !booking) return
    const anno = new Date(booking.dataInizio).getFullYear()
    getSharedTaskState(currentStep.sharedTaskGroupId, anno).then(setSharedState)
  }, [currentStep, booking])

  useEffect(() => {
    if (!bookingId || !flow) return
    if (steps.length > 0 && currentIndex === -1) {
      markChecklistCompleted(bookingId, flow)
    }
  }, [bookingId, flow, steps.length, currentIndex])

  if (loadingBooking || loadingSteps) return <p className="text-stone text-sm">Caricamento...</p>
  if (!booking || !house || !flow) return <p>Soggiorno non trovato.</p>
  if (!currentMember) return null

  async function completeStep(stepId: string, valore?: string | null, foto?: string | null) {
    const stepState: ChecklistStepState = {
      fatto: true,
      da: currentMember!.id,
      quando: new Date().toISOString(),
      valore: valore ?? null,
      foto: foto ?? null,
    }
    setStepStates((prev) => ({ ...prev, [stepId]: stepState }))
    await upsertChecklistStep(bookingId!, flow!, stepId, stepState)

    const stepDef = steps.find((s) => s.id === stepId)
    if (stepDef?.effect === 'create-handoff-lenzuola') {
      await createHandoffItem({
        houseId: house!.id,
        descrizione: 'Lenzuola pulite da riportare',
        segnalatoDa: currentMember!.id,
        autoGenerato: true,
        bookingOrigineId: booking!.id,
      })
    }
  }

  async function handleBack() {
    if (currentIndex <= 0) return
    const prevStep = visibleSteps[currentIndex - 1]
    const resetState: ChecklistStepState = { fatto: false, da: null, quando: null, valore: null, foto: null }
    setStepStates((prev) => ({ ...prev, [prevStep.id]: resetState }))
    await upsertChecklistStep(bookingId!, flow!, prevStep.id, resetState)
  }

  async function handleSharedTaskDone() {
    if (!currentStep?.sharedTaskGroupId || !booking) return
    const anno = new Date(booking.dataInizio).getFullYear()
    const state = await setSharedTaskDone(currentStep.sharedTaskGroupId, anno, currentMember!.id)
    setSharedState(state)
    await completeStep(currentStep.id, 'fatto')
  }

  async function handlePhotoChange(file: File | null) {
    if (!file) return
    const dataUrl = await compressImage(file)
    setPendingFoto(dataUrl)
  }

  if (currentStep === null) {
    const doneMessage =
      flow === 'chiusura'
        ? 'Amen: il tuo lavoro qui è finito, alla prossima missione.'
        : flow === 'apertura'
          ? 'Apertura completata!'
          : 'Pre partenza completata, buon viaggio!'
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-5xl">✅</p>
        <h1 className="font-display font-extrabold text-xl">{doneMessage}</h1>
        <p className="text-ink-soft">
          {house.nome} · <span className="font-mono">{formatDateRange(booking.dataInizio, booking.dataFine)}</span>
        </p>
        <Link to={`/case/${house.slug}`} className="inline-block rounded-lg bg-shutter text-white font-semibold px-5 py-2.5">
          Torna alla casa
        </Link>
      </div>
    )
  }

  const progressLabel = `${currentIndex}/${visibleSteps.length}`
  const flowLabel = flow === 'pre-partenza' ? 'Pre partenza' : flow === 'apertura' ? 'Apertura' : 'Chiusura'

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] font-bold text-stone uppercase tracking-widest">
          {house.nome} · {flowLabel}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="font-mono text-xs font-bold text-ink-soft tabular-nums mr-1">{progressLabel}</span>
          {visibleSteps.map((s, i) => (
            <span
              key={s.id}
              className={`h-[4px] flex-1 rounded-full ${i < currentIndex ? 'bg-shutter' : 'bg-stone-line'}`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-line bg-surface p-5 space-y-4 shadow-sm">
        <p className="font-display font-bold text-lg leading-snug">
          <span className="mr-2">{currentStep.emoji}</span>
          {currentStep.label}
        </p>

        {currentStep.kind === 'handoff-check' && (
          <div className="space-y-2">
            {handoffItems.length === 0 && <p className="text-sm text-stone">Nessun oggetto segnalato da portare.</p>}
            {handoffItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-terracotta/35 bg-terracotta/10 px-3 py-2 text-sm"
              >
                <span>{item.descrizione}</span>
                <button
                  onClick={async () => {
                    await markHandoffDelivered(item.id)
                    setHandoffItems((prev) => prev.filter((i) => i.id !== item.id))
                  }}
                  className="text-xs rounded-md bg-surface border border-terracotta/50 px-2 py-1"
                >
                  Consegnato
                </button>
              </div>
            ))}
            <button
              onClick={() => completeStep(currentStep.id, 'controllato')}
              className="w-full rounded-lg bg-shutter text-white font-semibold py-2.5"
            >
              Continua
            </button>
          </div>
        )}

        {currentStep.kind === 'shared-task' && (
          <div className="space-y-3">
            {sharedState?.fatto ? (
              <p className="text-sm rounded-lg bg-success/10 text-success px-3 py-2">
                ✅ Già fatta (dall’altro alloggio o in precedenza)
              </p>
            ) : (
              <p className="text-sm text-ink-soft">Non ancora segnata come fatta quest’anno.</p>
            )}
            <button
              onClick={handleSharedTaskDone}
              disabled={sharedState?.fatto}
              className="w-full rounded-lg bg-shutter text-white font-semibold py-2.5 disabled:opacity-50"
            >
              {sharedState?.fatto ? 'Già fatta — continua' : 'Segna come fatta'}
            </button>
            {sharedState?.fatto && (
              <button
                onClick={() => completeStep(currentStep.id, 'gia-fatta')}
                className="w-full rounded-lg border border-shutter text-shutter font-semibold py-2.5"
              >
                Continua
              </button>
            )}
          </div>
        )}

        {currentStep.kind === 'choice' && (
          <div className="flex flex-col gap-2">
            {currentStep.options?.map((opt) => (
              <button
                key={opt.value}
                onClick={() => completeStep(currentStep.id, opt.value, pendingFoto)}
                className="rounded-lg border border-shutter text-shutter font-semibold py-2.5"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {currentStep.kind === 'scorte' && !currentStep.freeText && (
          <div className="flex flex-col gap-2">
            {currentStep.options?.map((opt) => (
              <button
                key={opt.value}
                onClick={() => completeStep(currentStep.id, opt.value)}
                className="rounded-lg border border-shutter text-shutter font-semibold py-2.5"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {currentStep.kind === 'scorte' && currentStep.freeText && (
          <div className="space-y-2">
            <input
              value={freeTextValue}
              onChange={(e) => setFreeTextValue(e.target.value)}
              placeholder="Es. detersivo piatti (lascia vuoto se nulla)"
              className="w-full rounded-lg border border-stone-line bg-surface px-3 py-2 text-sm"
            />
            <button
              onClick={() => completeStep(currentStep.id, freeTextValue.trim() || 'nulla')}
              className="w-full rounded-lg bg-shutter text-white font-semibold py-2.5"
            >
              Continua
            </button>
          </div>
        )}

        {(currentStep.kind === 'confirm' || currentStep.kind === 'info') && (
          <div className="space-y-3">
            {currentStep.kind === 'confirm' && (
              <label className="block text-sm text-ink-soft">
                📷 Foto facoltativa (promemoria personale)
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-xs"
                />
                {pendingFoto && (
                  <img src={pendingFoto} alt="anteprima" className="mt-2 rounded-lg max-h-40 object-cover" />
                )}
              </label>
            )}
            <button
              onClick={() => completeStep(currentStep.id, null, pendingFoto)}
              className="w-full rounded-lg bg-shutter text-white font-semibold py-2.5"
            >
              {currentStep.kind === 'info' ? 'Avanti' : 'Fatto ✅'}
            </button>
          </div>
        )}
      </div>

      {currentIndex > 0 && (
        <button onClick={handleBack} className="text-sm text-stone">
          ← torna allo step precedente
        </button>
      )}
    </div>
  )
}
