import type { FinancialSummary } from '../../types/finance'
import { formatCurrency } from '../../utils/format'

interface SummaryCardsProps {
  summary: FinancialSummary
}

const CARDS = [
  {
    key: 'balance' as const,
    label: 'Saldo disponible',
    icon: '💰',
    gradient: 'summary-card--mint',
    hint: 'Dinero que tienes ahora mismo',
  },
  {
    key: 'monthlyIncome' as const,
    label: 'Ingresos del mes',
    icon: '📈',
    gradient: 'summary-card--sky',
    hint: 'Todo lo que has recibido este mes',
  },
  {
    key: 'monthlyExpenses' as const,
    label: 'Gastos del mes',
    icon: '📉',
    gradient: 'summary-card--peach',
    hint: 'Todo lo que has gastado este mes',
  },
  {
    key: 'cashFlow' as const,
    label: 'Flujo de caja',
    icon: '⚖️',
    gradient: 'summary-card--lavender',
    hint: 'Ingresos menos gastos',
  },
]

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section className="summary-cards" aria-label="Resumen de tu dinero">
      {CARDS.map((card) => {
        const value = summary[card.key]
        const isNegative = card.key === 'cashFlow' && value < 0

        return (
          <article
            key={card.key}
            className={`summary-card ${card.gradient}`}
            aria-label={`${card.label}: ${formatCurrency(value)}`}
          >
            <div className="summary-card__top">
              <span className="summary-card__icon" aria-hidden="true">
                {card.icon}
              </span>
              <p className="summary-card__label">{card.label}</p>
            </div>
            <p
              className={`summary-card__value ${isNegative ? 'summary-card__value--negative' : ''}`}
              aria-hidden="true"
            >
              {formatCurrency(value)}
            </p>
            <p className="summary-card__hint">{card.hint}</p>
          </article>
        )
      })}
    </section>
  )
}
