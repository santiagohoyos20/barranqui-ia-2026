import { useState } from 'react'
import type { AdvisorMetric, AppointmentDetail } from '../../types/appointments'
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../../utils/format'

interface AdvisorsPanelProps {
  advisors: AdvisorMetric[]
  appointments: AppointmentDetail[]
}

function statusClass(status: AppointmentDetail['status']): string {
  if (status === 'confirmed') return 'appointment-inline__status--confirmed'
  if (status === 'pending_confirmation') return 'appointment-inline__status--pending'
  return 'appointment-inline__status--rejected'
}

export function AdvisorsPanel({ advisors, appointments }: AdvisorsPanelProps) {
  const [expandedAdvisorId, setExpandedAdvisorId] = useState<string | null>(null)

  const totalConfirmed = advisors.reduce((sum, advisor) => sum + advisor.appointments, 0)
  const totalPending = advisors.reduce((sum, advisor) => sum + advisor.pendingAppointments, 0)

  function toggleAdvisor(advisorId: string) {
    setExpandedAdvisorId((current) => (current === advisorId ? null : advisorId))
  }

  return (
    <article className="panel panel--wide" aria-label="Citas agendadas por asesor">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Citas agendadas por asesor</h2>
          <p className="panel__subtitle">
            Usa la flecha para desplegar los clientes y productos asignados a cada asesor.
          </p>
        </div>
        <div className="advisor-summary-cards">
          <div className="advisor-summary-cards__item">
            <span>Total confirmadas</span>
            <strong>{formatNumber(totalConfirmed)}</strong>
          </div>
          <div className="advisor-summary-cards__item">
            <span>Pendientes de confirmación</span>
            <strong>{formatNumber(totalPending)}</strong>
          </div>
        </div>
      </div>

      {advisors.length === 0 ? (
        <p className="panel__empty">No hay citas asignadas a asesores.</p>
      ) : (
        <div className="table-card">
          <div className="table-card__row table-card__row--head table-card__row--advisors-expand">
            <span>Asesor</span>
            <span>Citas confirmadas</span>
            <span>Pendientes</span>
            <span>Participación</span>
            <span>Días prom.</span>
            <span>No-show</span>
            <span aria-hidden="true" />
          </div>

          {advisors.map((advisor) => {
            const isExpanded = expandedAdvisorId === advisor.id
            const advisorAppointments = appointments.filter(
              (appointment) => appointment.advisorId === advisor.id,
            )

            return (
              <div key={advisor.id} className="advisor-table-group">
                <div
                  className={`table-card__row table-card__row--advisors-expand ${
                    isExpanded ? 'table-card__row--expanded' : ''
                  }`}
                >
                  <span className="table-card__primary">{advisor.name}</span>
                  <span className="table-card__highlight">{formatNumber(advisor.appointments)}</span>
                  <span>{formatNumber(advisor.pendingAppointments)}</span>
                  <span>{formatPercent(advisor.conversionRate)}</span>
                  <span>{advisor.avgDaysToAppointment} días</span>
                  <span>{formatPercent(advisor.noShowRate)}</span>
                  <button
                    type="button"
                    className={`advisor-table-toggle ${isExpanded ? 'advisor-table-toggle--open' : ''}`}
                    onClick={() => toggleAdvisor(advisor.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} citas de ${advisor.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>

                {isExpanded ? (
                  <div className="advisor-table-expand">
                    {advisorAppointments.length === 0 ? (
                      <p className="advisor-table-expand__empty">Este asesor no tiene citas asignadas.</p>
                    ) : (
                      <div className="appointment-inline-list">
                        {advisorAppointments.map((appointment) => (
                          <div key={appointment.id} className="appointment-inline">
                            <div className="appointment-inline__header">
                              <div>
                                <strong>{appointment.clientName}</strong>
                                <p>{appointment.productName}</p>
                              </div>
                              <span className={`appointment-inline__status ${statusClass(appointment.status)}`}>
                                {appointment.statusLabel}
                              </span>
                            </div>
                            <div className="appointment-inline__details">
                              <span>Tel: {appointment.clientPhone}</span>
                              <span>
                                Ingresos:{' '}
                                {appointment.clientIncome != null
                                  ? formatCurrency(appointment.clientIncome)
                                  : '—'}
                              </span>
                              <span>Doc: {appointment.clientIdNumber ?? '—'}</span>
                              <span>Cita: {formatDate(appointment.scheduledAt)}</span>
                            </div>
                            {appointment.summary ? (
                              <p className="appointment-inline__summary">{appointment.summary}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
