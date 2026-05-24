import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
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

  const advisorPerformance = data.advisors.map((advisor) => ({
    name: advisor.name,
    citas: advisor.appointments,
    conversión: advisor.conversionRate,
    noShow: advisor.noShowRate,
  }))

  const voiceVsText = [
    { name: 'Voz', value: 31 },
    { name: 'Texto', value: 18 },
  ]

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
              <h2 className="panel__title">Conversión por producto</h2>
              <p className="panel__subtitle">Las oportunidades más fuertes y dónde está el mayor potencial.</p>
            </div>
          </div>

          <div className="chart-card__body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.products} margin={{ top: 12, right: 10, left: 0, bottom: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="product" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={62} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<TooltipCard />} />
                <Legend />
                <Bar dataKey="conversionRate" name="Conversión" radius={[10, 10, 0, 0]} isAnimationActive>
                  {data.products.map((entry, index) => (
                    <Cell key={entry.product} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="conversion-rank">
              {productShare.map((item, index) => (
                <div key={item.name} className="conversion-rank__item">
                  <span className="conversion-rank__index">{index + 1}</span>
                  <div>
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
              <h2 className="panel__title">Fricción principal</h2>
              <p className="panel__subtitle">Rechazos más frecuentes con lectura visual rápida.</p>
            </div>
          </div>

          <div className="chart-card__body chart-card__body--stacked">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={data.rejections}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={5}
                  stroke="none"
                  isAnimationActive
                >
                  {data.rejections.map((entry, index) => (
                    <Cell key={entry.label} fill={REJECTION_COLORS[index % REJECTION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipCard />} />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
              </PieChart>
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

      <div className="dashboard-charts__split">
        <article className="panel chart-card chart-enter chart-enter--delay-3">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Asesores en foco</h2>
              <p className="panel__subtitle">Citas, no-shows y conversión comparados de forma radial.</p>
            </div>
          </div>

          <div className="chart-card__body">
            <ResponsiveContainer width="100%" height={290}>
              <RadialBarChart
                innerRadius="18%"
                outerRadius="88%"
                data={advisorPerformance}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 60]} tick={false} />
                <RadialBar dataKey="citas" cornerRadius={12} fill={PRODUCT_COLORS[0]} isAnimationActive />
                <Tooltip content={<TooltipCard />} />
                <Legend />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel chart-card chart-enter chart-enter--delay-4">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Voz vs texto</h2>
              <p className="panel__subtitle">El canal de voz ya se ve más fuerte en conversión.</p>
            </div>
          </div>

          <div className="chart-card__body chart-card__body--stacked">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={voiceVsText}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={78}
                  paddingAngle={4}
                  isAnimationActive
                >
                  {voiceVsText.map((entry, index) => (
                    <Cell key={entry.name} fill={PRODUCT_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipCard />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="voice-compare">
              <div className="voice-compare__item">
                <strong>Voz</strong>
                <span>31% conversión</span>
              </div>
              <div className="voice-compare__item">
                <strong>Texto</strong>
                <span>18% conversión</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
