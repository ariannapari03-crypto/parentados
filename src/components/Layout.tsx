import { NavLink, Outlet } from 'react-router-dom'
import { useFamily } from '../context/FamilyContext'
import { useRealtimeQuery } from '../hooks/useRealtimeQuery'
import { listIssues } from '../lib/repo'

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
    <div className="flex flex-col min-h-svh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-teal-700 dark:text-teal-400">
          <span className="text-xl">🏡</span>
          <span>Case Famiglia</span>
        </div>
        {currentMember && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Ciao, <strong className="text-slate-700 dark:text-slate-200">{currentMember.nome}</strong>
          </span>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-xl grid grid-cols-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  isActive ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <span className="relative text-xl leading-none">
                {item.emoji}
                {item.to === '/guasti' && openIssuesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {openIssuesCount}
                  </span>
                )}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
