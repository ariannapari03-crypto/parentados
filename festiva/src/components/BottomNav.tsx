import { NavLink } from 'react-router-dom'

export interface NavItem {
  to: string
  label: string
  emoji: string
  end?: boolean
}

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav
      style={{
        flex: '0 0 auto',
        display: 'flex',
        justifyContent: 'space-around',
        background: 'var(--surface)',
        borderTop: '1px solid var(--surface-line)',
        padding: '8px 6px calc(10px + env(safe-area-inset-bottom))',
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className="fx-navitem"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '5px 9px',
            borderRadius: 10,
            textDecoration: 'none',
            fontSize: '0.62rem',
            fontWeight: 700,
            color: isActive ? 'var(--color-sage-dk)' : 'var(--ink-soft)',
            background: isActive ? 'rgba(168,181,160,0.14)' : 'transparent',
          })}
        >
          <span style={{ fontSize: 18 }}>{item.emoji}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
