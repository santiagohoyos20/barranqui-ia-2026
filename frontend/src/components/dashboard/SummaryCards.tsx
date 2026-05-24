import type { CommercialKpi } from '../../types/commercial'
import { formatNumber, formatPercent } from '../../utils/format'

interface SummaryCardsProps {
  summary: CommercialKpi[]
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section className="summary-cards" aria-label="Resumen ejecutivo comercial">
      {summary.map((card) => {
        const value = card.id === 'conversion'
          ? formatPercent(card.value)
          : formatNumber(card.value)

        return (
          <article key={card.id} className={`summary-card summary-card--${card.tone}`}>
            <div className="summary-card__top">
              <span className="summary-card__icon" aria-hidden="true">
                {card.icon}
              </span>
              <p className="summary-card__label">{card.label}</p>
            </div>
            <p className="summary-card__value">{value}</p>
            <p className="summary-card__trend">{card.trend}</p>
            <p className="summary-card__hint">{card.description}</p>
          </article>
        )
      })}
    </section>
  )
}
