import type { Category } from '../types/finance'

export const EXPENSE_COLORS: Record<string, string> = {
  Alimentación: '#FF9AA2',
  Transporte: '#FFB7B2',
  'Vivienda (arriendo, hipoteca)': '#FFDAC1',
  'Servicios públicos': '#E2F0CB',
  Salud: '#B5EAD7',
  Educación: '#C7CEEA',
  Entretenimiento: '#A0C4FF',
  Compras: '#FFC6FF',
  Viajes: '#FDFFB6',
  Mascotas: '#CAFFBF',
  Suscripciones: '#9BF6FF',
  'Otros gastos': '#BDB2FF',
}

export const INCOME_COLORS: Record<string, string> = {
  Salario: '#B5EAD7',
  Inversiones: '#C7CEEA',
  'Otros ingresos': '#A0C4FF',
}

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Salario', type: 'ingreso' },
  { id: 2, name: 'Inversiones', type: 'ingreso' },
  { id: 3, name: 'Otros ingresos', type: 'ingreso' },
  { id: 4, name: 'Alimentación', type: 'gasto' },
  { id: 5, name: 'Transporte', type: 'gasto' },
  { id: 6, name: 'Vivienda (arriendo, hipoteca)', type: 'gasto' },
  { id: 7, name: 'Servicios públicos', type: 'gasto' },
  { id: 8, name: 'Salud', type: 'gasto' },
  { id: 9, name: 'Educación', type: 'gasto' },
  { id: 10, name: 'Entretenimiento', type: 'gasto' },
  { id: 11, name: 'Compras', type: 'gasto' },
  { id: 12, name: 'Viajes', type: 'gasto' },
  { id: 13, name: 'Mascotas', type: 'gasto' },
  { id: 14, name: 'Suscripciones', type: 'gasto' },
  { id: 15, name: 'Otros gastos', type: 'gasto' },
]

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.type === 'gasto')
export const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.type === 'ingreso')

export function getCategoryColor(name: string, type: Category['type']): string {
  if (type === 'gasto') return EXPENSE_COLORS[name] ?? '#BDB2FF'
  return INCOME_COLORS[name] ?? '#B5EAD7'
}

export function getCategoryById(id: number): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}
