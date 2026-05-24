import { useState } from 'react'
import { EXPENSE_CATEGORIES } from '../../constants/categories'
import { useFinanceDashboard } from '../../hooks/useFinanceDashboard'
import type { ChartPeriod } from '../../types/finance'
import { CashFlowChart } from './CashFlowChart'
import { CategoryHistoryPanel } from './CategoryHistoryPanel'
import { ExpenseCharts } from './ExpenseCharts'
import { PeriodSelector } from './PeriodSelector'
import { SummaryCards } from './SummaryCards'

export function DashboardPage() {
  const [period, setPeriod] = useState<ChartPeriod>('monthly')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const { data, expenses, loading, error, reload } = useFinanceDashboard(period)

  if (loading && !data) {
    return (
      <div className="page page--dashboard">
        <div className="page-loading">
          <div className="page-loading__spinner" aria-hidden="true" />
          <p>Cargando tu resumen financiero...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page page--dashboard">
        <div className="page-error">
          <p>{error ?? 'No se pudieron cargar los datos'}</p>
          <button type="button" onClick={reload} className="btn-primary">
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page page--dashboard">
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Hola, {data.user.full_name ?? 'Usuario'}</h1>
          <p className="page-header__subtitle">
            Aquí puedes ver un resumen claro de tu dinero. Todo en un solo lugar.
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </header>

      <SummaryCards summary={data.summary} />

      <CashFlowChart data={data.periodTrend} />

      <ExpenseCharts
        data={expenses}
        selectedCategoryId={selectedCategoryId}
        onCategoryClick={setSelectedCategoryId}
      />

      <section className="category-quick-list" aria-label="Categorías de gasto">
        <h2 className="section-title">Ver historial por categoría</h2>
        <p className="section-subtitle">Selecciona una categoría para ver cada movimiento</p>
        <div className="category-chips">
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-chip ${selectedCategoryId === cat.id ? 'category-chip--active' : ''}`}
              onClick={() =>
                setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <CategoryHistoryPanel
        categoryId={selectedCategoryId}
        onClose={() => setSelectedCategoryId(null)}
      />
    </div>
  )
}
