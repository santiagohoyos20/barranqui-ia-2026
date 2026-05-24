export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'percent',
    maximumFractionDigits,
  }).format(value / 100)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(dateStr))
}
