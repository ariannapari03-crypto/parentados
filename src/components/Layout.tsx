import { NavLink, Outlet } from 'react-router-dom'
import { useFamily } from '../context/FamilyContext'
import { useRealtimeQuery } from '../hooks/useRealtimeQuery'
import { listIssues } from '../lib/repo'
import { memberEmoji } from '../lib/memberDisplay'

const navItems = [
  { to: '/', label: 'Home', emoji: '🏠' },
  { to: '/guasti', label: 'Guasti', emoji: '🛠️' },
  { to: '/oggetti', label: 'Oggetti', emoji: '🧳' },
  { to: '/profilo', label: 'Profilo', emoji: '👤' },
]

export default function Layout() {
  const { currentMember } = useFamily()
  const { data: issues } = useRealtimeQuery('issues', () => listIssues(), [])
  const openIssuesCount = issues?.filter((i) => i.stato === 'aperto').length ?? 0

  return (
    <div className="flex flex-col min-h-svh text-ink font-sans">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-line bg-surface/85 backdrop-blur px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-semibold text-lg text-shutter leading-none">Parentados</span>
          <span className="font-display italic text-sm text-terracotta leading-none">in vacanza</span>
        </div>
        {currentMember && (
          <span className="flex items-center gap-1.5 text-sm text-ink-soft">
            <span className="text-base leading-none">{memberEmoji(currentMember)}</span>
            <strong className="font-semibold text-ink">{currentMember.nome}</strong>
          </span>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-10 border-t border-stone-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-xl grid grid-cols-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 py-2 text-xs font-semibold transition-colors ${
                  isActive ? 'text-shutter' : 'text-stone'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute -top-2 h-[3px] w-[22px] rounded-full bg-shutter" />}
                  <span className="relative text-xl leading-none">
                    {item.emoji}
                    {item.to === '/guasti' && openIssuesCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 font-mono text-[10px] font-bold text-white">
                        {openIssuesCount}
                      </span>
                    )}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
