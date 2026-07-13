interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl space-y-4"
      >
        <div>
          <p className="font-display font-bold text-ink">{title}</p>
          {message && <p className="text-sm text-ink-soft mt-1">{message}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-stone-line py-2.5 font-medium">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-shutter text-white py-2.5 font-semibold">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
