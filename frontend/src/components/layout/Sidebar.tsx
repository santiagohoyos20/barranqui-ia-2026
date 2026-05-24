import { NavLink } from 'react-router-dom'
import { getUserPhone } from '../../hooks/useFinanceDashboard'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Mi resumen',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/chat',
    label: 'Asistente',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const phone = getUserPhone()

  return (
    <aside className="sidebar" aria-label="Menú principal">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true">S</div>
        <div>
          <p className="sidebar__brand-name">Serfinanza</p>
          <p className="sidebar__brand-tag">Tu banco amigo</p>
        </div>
      </div>

      <div className="sidebar__profile">
        <div className="sidebar__avatar" aria-hidden="true">MG</div>
        <div>
          <p className="sidebar__user-name">María González</p>
          <p className="sidebar__user-phone">{phone}</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <p className="sidebar__help">
        Tip: escribe en el asistente como si hablaras con una persona. Ejemplo: &quot;Pagué 120 mil de mercado&quot;.
      </p>
    </aside>
  )
}
