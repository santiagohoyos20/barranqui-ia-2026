export const CHART_AXIS = {
  tick: { fontSize: 13, fill: '#4a5568' },
}

export const CHART_LEGEND = {
  wrapperStyle: { fontSize: '15px', lineHeight: '1.6', paddingTop: '12px' },
}

export const CHART_GRID = {
  strokeDasharray: '3 3',
  stroke: 'rgba(0,0,0,0.06)',
}

export const CHART_COLORS = {
  income: '#6BCB9A',
  expense: '#FF8A80',
  flow: '#9B8AFB',
  incomeFill: '#B5EAD7',
  expenseFill: '#FFB7B2',
}

export function formatAxisMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
  return `$${value}`
}
