import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PeriodDataPoint } from '../../types/finance'
import { formatCurrency } from '../../utils/format'

interface CashFlowChartProps {
  data: PeriodDataPoint[]
}

function FlowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="chart-tooltip__row" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <section className="chart-card chart-card--wide" aria-label="Flujo de caja">
      <h2 className="chart-card__title">Ingresos vs gastos</h2>
      <p className="chart-card__subtitle">Compara cuánto entra y cuánto sale</p>
      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ingresosGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B5EAD7" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#B5EAD7" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="gastosGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB7B2" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#FFB7B2" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 14, fill: '#4a5568' }} />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
              tick={{ fontSize: 13, fill: '#4a5568' }}
            />
            <Tooltip content={<FlowTooltip />} />
            <Legend wrapperStyle={{ fontSize: '15px', paddingTop: '12px' }} />
            <Area
              type="monotone"
              dataKey="ingresos"
              name="Ingresos"
              stroke="#6BCB9A"
              fill="url(#ingresosGrad)"
              strokeWidth={3}
            />
            <Area
              type="monotone"
              dataKey="gastos"
              name="Gastos"
              stroke="#FF8A80"
              fill="url(#gastosGrad)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card__body chart-card__body--secondary">
        <h3 className="chart-card__subtitle">Flujo neto (ingresos − gastos)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 14, fill: '#4a5568' }} />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
              tick={{ fontSize: 13, fill: '#4a5568' }}
            />
            <Tooltip content={<FlowTooltip />} />
            <Line
              type="monotone"
              dataKey="flujo"
              name="Flujo de caja"
              stroke="#9B8AFB"
              strokeWidth={4}
              dot={{ r: 6, fill: '#9B8AFB', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
