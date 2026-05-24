import { useState } from 'react'
import { PeriodSelector } from './PeriodSelector'
import { SummaryCards } from './SummaryCards'
import { CommercialCharts } from './CommercialCharts'
import { useCommercialDashboard } from '../../hooks/useCommercialDashboard'
import type { ChartPeriod } from '../../types/commercial'
import { formatDate, formatNumber, formatPercent } from '../../utils/format'

export function DashboardPage() {
  const [period, setPeriod] = useState<ChartPeriod>('monthly')
  const { data, loading, error, reload } = useCommercialDashboard(period)

  if (loading && !data) {
    return (
      <div className="page page--dashboard">
        <div className="page-loading">
          <div className="page-loading__spinner" aria-hidden="true" />
          <p>Cargando el tablero comercial...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page page--dashboard">
        <div className="page-error">
          <p>{error ?? 'No se pudieron cargar los datos del dashboard'}</p>
          <button type="button" onClick={reload} className="btn-primary">
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  const conversionKpi = data.kpis.find((kpi) => kpi.id === 'conversion')

  return (
    <div className="page page--dashboard">
      <header className="page-header page-header--dashboard">
        <div className="hero-copy">
          <p className="eyebrow">Banco Serfinanza · IA comercial</p>
          <h1 className="page-header__title">{data.headline}</h1>
          <p className="page-header__subtitle">{data.subtitle}</p>
          <p className="hero-note">{data.executiveNote}</p>
        </div>
        <div className="hero-meta">
          <PeriodSelector value={period} onChange={setPeriod} />
          <div className="hero-meta__card">
            <span className="hero-meta__label">Última actualización</span>
            <strong className="hero-meta__value">{formatDate(data.updatedAt)}</strong>
          </div>
          <div className="hero-meta__card">
            <span className="hero-meta__label">Conversión principal</span>
            <strong className="hero-meta__value">{formatPercent(conversionKpi?.value ?? 0)}</strong>
          </div>
        </div>
      </header>

      <SummaryCards summary={data.kpis} />

      <CommercialCharts data={data} />

      <section className="dashboard-grid dashboard-grid--hero">
        <article className="panel panel--wide" aria-label="Embudo comercial">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Embudo comercial</h2>
              <p className="panel__subtitle">Usuarios, interés, precalificación y citas generadas.</p>
            </div>
          </div>

          <div className="funnel-list">
            {data.funnel.map((stage, index) => (
              <div key={stage.label} className="funnel-step">
                <div className="funnel-step__header">
                  <div>
                    <p className="funnel-step__label">{stage.label}</p>
                    <p className="funnel-step__helper">{stage.helper}</p>
                  </div>
                  <strong className="funnel-step__value">{formatNumber(stage.value)}</strong>
                </div>
                <div className="funnel-step__bar">
                  <span style={{ width: `${stage.percent}%` }} />
                </div>
                <div className="funnel-step__meta">
                  <span>Etapa {index + 1}</span>
                  <span>{formatPercent(stage.percent)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel" aria-label="Tendencia comercial">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Tendencia de conversaciones</h2>
              <p className="panel__subtitle">Consultas, interés y citas a lo largo del periodo.</p>
            </div>
          </div>
          <div className="trend-list">
            {data.trend.map((point) => (
              <div key={point.label} className="trend-item">
                <div className="trend-item__header">
                  <strong>{point.label}</strong>
                  <span>{formatNumber(point.appointments)} citas</span>
                </div>
                <div className="trend-item__bars">
                  <div>
                    <span>Consultas</span>
                    <strong>{formatNumber(point.consultations)}</strong>
                  </div>
                  <div>
                    <span>Interesados</span>
                    <strong>{formatNumber(point.interested)}</strong>
                  </div>
                  <div>
                    <span>Citas</span>
                    <strong>{formatNumber(point.appointments)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--secondary">
        <article className="panel" aria-label="Interés por producto">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Interés por producto</h2>
              <p className="panel__subtitle">Qué pide la gente y qué tanto se convierte en cita.</p>
            </div>
          </div>
          <div className="table-card">
            <div className="table-card__row table-card__row--head">
              <span>Producto</span>
              <span>Consultas</span>
              <span>Citas</span>
              <span>Conversión</span>
            </div>
            {data.products.map((product) => (
              <div key={product.product} className="table-card__row">
                <span className="table-card__primary">{product.product}</span>
                <span>{formatNumber(product.consultations)}</span>
                <span>{formatNumber(product.appointments)}</span>
                <span className="table-card__highlight">{formatPercent(product.conversionRate)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel" aria-label="Fricción y rechazo">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Rechazos y fricción</h2>
              <p className="panel__subtitle">Dónde se rompe el flujo y por qué se pierden oportunidades.</p>
            </div>
          </div>
          <div className="stacked-list">
            {data.rejections.map((reason) => (
              <div key={reason.label} className="stacked-list__item">
                <div>
                  <strong>{reason.label}</strong>
                  <p>{formatNumber(reason.count)} casos · {formatPercent(reason.share)}</p>
                </div>
                <div className="stacked-list__bar">
                  <span style={{ width: `${reason.share}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="abandonment-grid">
            {data.abandonment.map((step) => (
              <div key={step.label} className="mini-metric">
                <strong>{step.label}</strong>
                <span>{formatPercent(step.dropRate)} abandona aquí</span>
                <p>{formatNumber(step.count)} casos por punto de abandono</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--secondary" aria-label="Insights comerciales">
        <article className="panel">
          <h2 className="panel__title">Productos más consultados</h2>
          <p className="panel__subtitle">Ranking rápido de los productos con mayor interés.</p>
          <div className="pill-list">
            {data.topQuestions.map((question) => (
              <span key={question} className="pill">{question}</span>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2 className="panel__title">Motivos de rechazo</h2>
          <p className="panel__subtitle">Señales más repetidas cuando el usuario no avanza.</p>
          <div className="insight-list">
            {data.emergingTopics.map((topic) => (
              <div key={topic} className="insight-list__item">
                <span className="insight-list__dot" aria-hidden="true" />
                <p>{topic}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
