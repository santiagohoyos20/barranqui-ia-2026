import { AdvisorsPanel } from './AdvisorsPanel'
import { useAppointments } from '../../hooks/useAppointments'
import { formatDate } from '../../utils/format'

export function AppointmentsPage() {
  const { data, loading, refreshing, error, reload } = useAppointments()

  if (loading && !data) {
    return (
      <div className="page page--dashboard">
        <div className="page-loading">
          <div className="page-loading__spinner" aria-hidden="true" />
          <p>Cargando citas de asesores...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page page--dashboard">
        <div className="page-error">
          <p>{error ?? 'No se pudieron cargar las citas'}</p>
          <button type="button" onClick={reload} className="btn-primary">
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page page--dashboard">
      <header className="page-header page-header--dashboard page-header--compact">
        <div className="hero-copy">
          <p className="eyebrow">Banco Serfinanza · IA comercial</p>
          <h1 className="page-header__title">Citas agendadas</h1>
          <p className="page-header__subtitle">
            Despliega cada asesor para ver sus clientes y el producto que desean adquirir.
          </p>
        </div>
        <div className="hero-meta">
          <button
            type="button"
            onClick={reload}
            className="btn-primary"
            disabled={refreshing}
            aria-busy={refreshing}
          >
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </button>
          <div className="hero-meta__card">
            <span className="hero-meta__label">Última actualización</span>
            <strong className="hero-meta__value">{formatDate(data.updatedAt)}</strong>
          </div>
        </div>
      </header>

      <AdvisorsPanel advisors={data.advisors} appointments={data.appointments} />
    </div>
  )
}
