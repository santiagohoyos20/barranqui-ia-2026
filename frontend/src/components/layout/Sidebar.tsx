import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
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
  return (
    <aside className="sidebar" aria-label="Menú principal">
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true">B</div>
        <div>
          <p className="sidebar__brand-name">Banco Serfinanza</p>
          <p className="sidebar__brand-tag">Dashboard comercial</p>
        </div>
      </div>

      <div className="sidebar__profile">
        <div className="sidebar__avatar" aria-hidden="true">GC</div>
        <div>
          <p className="sidebar__user-name">Gerencia comercial</p>
          <p className="sidebar__user-phone">Conversión de leads y citas</p>
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
        Tip: este panel está diseñado para ver interés por producto, fricción y oportunidades de negocio en un solo lugar.
      </p>
    </aside>
  )
}
