/** Sfondo centrato per le schermate di autenticazione (login / registrazione). */
export function AuthCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
      }}
    >
      <div className="fx-card" style={{ width: '100%', maxWidth: 400, padding: 26 }}>
        {children}
      </div>
    </div>
  )
}
