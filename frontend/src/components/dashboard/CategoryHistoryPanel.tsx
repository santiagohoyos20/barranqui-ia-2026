import { getCategoryById } from '../../constants/categories'
import { useCategoryHistory } from '../../hooks/useFinanceDashboard'
import { formatCurrency, formatDate } from '../../utils/format'

interface CategoryHistoryPanelProps {
  categoryId: number | null
  onClose: () => void
}

export function CategoryHistoryPanel({ categoryId, onClose }: CategoryHistoryPanelProps) {
  const { transactions, loading } = useCategoryHistory(categoryId)
  const category = categoryId ? getCategoryById(categoryId) : null

  if (!categoryId || !category) return null

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <section className="category-history" aria-label={`Historial de ${category.name}`}>
      <header className="category-history__header">
        <div>
          <h2 className="category-history__title">{category.name}</h2>
          <p className="category-history__total">
            Total registrado: <strong>{formatCurrency(total)}</strong>
          </p>
        </div>
        <button
          type="button"
          className="category-history__close"
          onClick={onClose}
          aria-label="Cerrar historial"
        >
          ×
        </button>
      </header>

      {loading ? (
        <p className="category-history__loading">Cargando movimientos...</p>
      ) : transactions.length === 0 ? (
        <p className="category-history__empty">
          Aún no hay registros en esta categoría. Puedes agregar uno escribiéndole al asistente.
        </p>
      ) : (
        <ul className="category-history__list">
          {transactions.map((tx) => (
            <li key={tx.id} className="category-history__item">
              <div className="category-history__item-main">
                <p className="category-history__desc">
                  {tx.description || 'Sin descripción'}
                </p>
                <p className="category-history__date">{formatDate(tx.transaction_date)}</p>
              </div>
              <p className="category-history__amount">{formatCurrency(Number(tx.amount))}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
