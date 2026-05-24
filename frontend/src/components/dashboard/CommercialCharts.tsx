import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CommercialDashboardData } from '../../types/commercial'
import { formatNumber, formatPercent } from '../../utils/format'

interface CommercialChartsProps {
  data: CommercialDashboardData
}

const TREND_COLORS = ['#41d3b8', '#f8b84b', '#ff7d6b']
const PRODUCT_COLORS = ['#6be3cf', '#59b6ff', '#f8b84b', '#ff7d6b', '#94a3b8']
const REJECTION_COLORS = ['#ff7d6b', '#f8b84b', '#41d3b8', '#59b6ff', '#94a3b8']

function TooltipCard({
  active,
  payload,
  label,
}: {
  active?: boolean
  label?: string
  payload?: Array<{ name?: string; value?: number }>
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="chart-tooltip chart-tooltip--dark">
      {label ? <p className="chart-tooltip__title">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.name ?? 'value'} className="chart-tooltip__row">
          <span>{item.name}</span>
          <strong>{formatNumber(Number(item.value ?? 0))}</strong>
        </p>
      ))}
    </div>
  )
}

export function CommercialCharts({ data }: CommercialChartsProps) {
  const productShare = [...data.products]
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 5)
    .map((product) => ({
      name: product.product,
      value: product.conversionRate,
    }))

  const productChartData = [...data.products].sort((a, b) => b.consultations - a.consultations).slice(0, 6)
  const rejectedProductData = [...data.rejectedProducts].sort((a, b) => b.count - a.count).slice(0, 5)
  const abandonmentData = [...data.abandonment].sort((a, b) => b.count - a.count)

  return (
    <section className="dashboard-charts" aria-label="Gráficas comerciales">
      <article className="panel chart-card chart-card--wide chart-card--hero chart-enter">
        <div className="panel__header">
          <div>
            <h2 className="panel__title">Pulso comercial</h2>
            <p className="panel__subtitle">Consultas, interés y citas evolucionando en el periodo seleccionado.</p>
          </div>
          <span className="chart-badge">Live mock</span>
        </div>

        <div className="chart-card__body">
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={data.trend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="consultationsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#41d3b8" stopOpacity={0.36} />
                  <stop offset="95%" stopColor="#41d3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="interestedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f8b84b" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#f8b84b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipCard />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="consultations"
                name="Consultas"
                stroke={TREND_COLORS[0]}
                fillOpacity={1}
                fill="url(#consultationsFill)"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                isAnimationActive
              />
              <Area
                type="monotone"
                dataKey="interested"
                name="Interesados"
                stroke={TREND_COLORS[1]}
                fillOpacity={1}
                fill="url(#interestedFill)"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                isAnimationActive
              />
              <Area
                type="monotone"
                dataKey="appointments"
                name="Citas"
                stroke={TREND_COLORS[2]}
                fill="none"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 7 }}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <div className="dashboard-charts__split">
        <article className="panel chart-card chart-enter chart-enter--delay-1">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Interés por producto</h2>
              <p className="panel__subtitle">Consultas y citas comparadas por producto con enfoque comercial.</p>
            </div>
          </div>

          <div className="chart-card__body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={productChartData} margin={{ top: 12, right: 10, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis
                  dataKey="product"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={72}
                  tickFormatter={(value: string) =>
                    value.length > 18 ? `${value.slice(0, 16)}…` : value
                  }
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipCard />} />
                <Legend />
                <Bar dataKey="consultations" name="Consultas" radius={[10, 10, 0, 0]} isAnimationActive>
                  {productChartData.map((entry, index) => (
                    <Cell key={entry.product} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                  ))}
                </Bar>
                <Bar dataKey="appointments" name="Citas" radius={[10, 10, 0, 0]} isAnimationActive>
                  {productChartData.map((entry, index) => (
                    <Cell key={`${entry.product}-apt`} fill={REJECTION_COLORS[index % REJECTION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="conversion-rank">
              {productShare.map((item, index) => (
                <div key={item.name} className="conversion-rank__item">
                  <span className="conversion-rank__index">{index + 1}</span>
                  <div className="conversion-rank__content">
                    <strong>{item.name}</strong>
                    <p>{formatPercent(item.value)} de conversión</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="panel chart-card chart-enter chart-enter--delay-2">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Productos con mayor rechazo</h2>
              <p className="panel__subtitle">Dónde se caen más usuarios por producto.</p>
            </div>
          </div>

          <div className="chart-card__body chart-card__body--stacked">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rejectedProductData} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="product" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipCard />} />
                <Bar dataKey="count" name="Rechazos" radius={[0, 10, 10, 0]} isAnimationActive>
                  {rejectedProductData.map((entry, index) => (
                    <Cell key={entry.product} fill={REJECTION_COLORS[index % REJECTION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="chart-metrics-list">
              {data.rejections.slice(0, 3).map((reason, index) => (
                <div key={reason.label} className="chart-metrics-list__item">
                  <span className="chart-metrics-list__dot" style={{ background: REJECTION_COLORS[index] }} />
                  <div>
                    <strong>{reason.label}</strong>
                    <p>{formatNumber(reason.count)} casos · {formatPercent(reason.share)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <article className="panel chart-card chart-card--wide chart-enter chart-enter--delay-3">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Punto de abandono</h2>
              <p className="panel__subtitle">Dónde se va más gente en el flujo conversacional.</p>
            </div>
          </div>

          <div className="chart-card__body chart-card__body--stacked">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={abandonmentData} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipCard />} />
                <Bar dataKey="count" name="Abandonos" radius={[0, 10, 10, 0]} isAnimationActive>
                  {abandonmentData.map((entry, index) => (
                    <Cell key={entry.label} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="chart-metrics-list">
              {data.abandonment.slice(0, 3).map((step, index) => (
                <div key={step.label} className="chart-metrics-list__item">
                  <span className="chart-metrics-list__dot" style={{ background: PRODUCT_COLORS[index] }} />
                  <div>
                    <strong>{step.label}</strong>
                    <p>{formatNumber(step.count)} casos · {formatPercent(step.dropRate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
    </section>
  )
}
