import type { ChartPeriod } from '../../types/finance'

interface PeriodSelectorProps {
  value: ChartPeriod
  onChange: (period: ChartPeriod) => void
}

const PERIODS: { value: ChartPeriod; label: string; description: string }[] = [
  { value: 'weekly', label: 'Semanal', description: 'Últimos 7 días' },
  { value: 'monthly', label: 'Mensual', description: 'Último mes' },
  { value: 'semestral', label: 'Semestral', description: 'Últimos 6 meses' },
]

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="period-selector" role="group" aria-label="Seleccionar periodo">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          className={`period-selector__btn ${value === p.value ? 'period-selector__btn--active' : ''}`}
          onClick={() => onChange(p.value)}
          aria-pressed={value === p.value}
          title={p.description}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
