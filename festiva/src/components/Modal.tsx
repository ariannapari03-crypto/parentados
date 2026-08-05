interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,14,26,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fx-card"
        style={{
          width: '100%',
          maxWidth: 480,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          padding: 20,
          maxHeight: '88dvh',
          overflowY: 'auto',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ink)' }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--ink-soft)', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
