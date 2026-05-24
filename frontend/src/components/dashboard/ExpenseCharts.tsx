import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CategoryTotal } from '../../types/finance'
import { formatCurrency } from '../../utils/format'

interface ExpenseChartsProps {
  data: CategoryTotal[]
  onCategoryClick: (categoryId: number) => void
  selectedCategoryId: number | null
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategoryTotal }[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{item.categoryName}</p>
      <p className="chart-tooltip__value">{formatCurrency(item.total)}</p>
    </div>
  )
}

export function ExpenseCharts({ data, onCategoryClick, selectedCategoryId }: ExpenseChartsProps) {
  const sorted = [...data].sort((a, b) => b.total - a.total)
  const topCategories = sorted.slice(0, 6)

  return (
    <div className="charts-grid">
      <section className="chart-card chart-card--wide" aria-label="Gastos por categoría">
        <h2 className="chart-card__title">Gastos por categoría</h2>
        <p className="chart-card__subtitle">Toca una barra para ver el historial</p>
        <div className="chart-card__body">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sorted} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="categoryName"
                tick={{ fontSize: 12, fill: '#4a5568' }}
                angle={-25}
                textAnchor="end"
                interval={0}
                height={70}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 13, fill: '#4a5568' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                radius={[8, 8, 0, 0]}
                cursor="pointer"
                onClick={(entry) => {
                  const item = entry as unknown as CategoryTotal
                  if (item?.categoryId) onCategoryClick(item.categoryId)
                }}
              >
                {sorted.map((entry) => (
                  <Cell
                    key={entry.categoryId}
                    fill={entry.color}
                    opacity={selectedCategoryId && selectedCategoryId !== entry.categoryId ? 0.45 : 1}
                    stroke={selectedCategoryId === entry.categoryId ? '#2d3748' : 'none'}
                    strokeWidth={selectedCategoryId === entry.categoryId ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chart-card" aria-label="Distribución de gastos">
        <h2 className="chart-card__title">¿En qué se va tu dinero?</h2>
        <p className="chart-card__subtitle">Porcentaje por categoría</p>
        <div className="chart-card__body chart-card__body--donut">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={topCategories}
                dataKey="total"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                onClick={(_, index) => onCategoryClick(topCategories[index].categoryId)}
                cursor="pointer"
              >
                {topCategories.map((entry) => (
                  <Cell key={entry.categoryId} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                wrapperStyle={{ fontSize: '14px', lineHeight: '1.6' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
