import { getCategoryColor, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories'
import type {
  CategoryTotal,
  ChartPeriod,
  DashboardData,
  PeriodDataPoint,
  Transaction,
} from '../types/finance'

const DEMO_PHONE = '573001234567'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function generateTransactions(): Transaction[] {
  const transactions: Transaction[] = []
  let id = 1

  const addTx = (
    categoryId: number,
    amount: number,
    daysBack: number,
    description: string,
    source = 'manual',
  ) => {
    transactions.push({
      id: `tx-${id++}`,
      user_phone: DEMO_PHONE,
      category_id: categoryId,
      amount,
      description,
      transaction_date: daysAgo(daysBack),
      source,
      created_at: new Date().toISOString(),
    })
  }

  // Ingresos recientes
  addTx(1, 3200000, 5, 'Pago nómina marzo', 'nómina')
  addTx(1, 3200000, 35, 'Pago nómina febrero', 'nómina')
  addTx(2, 450000, 12, 'Rendimiento CDT', 'inversión')
  addTx(3, 180000, 20, 'Venta artículos usados', 'manual')

  // Gastos distribuidos en categorías
  const expenseSamples: [number, number, string][] = [
    [4, 285000, 'Mercado del mes'],
    [4, 95000, 'Supermercado'],
    [5, 120000, 'Transporte mensual'],
    [5, 45000, 'Taxi'],
    [6, 980000, 'Arriendo apartamento'],
    [7, 185000, 'Agua, luz e internet'],
    [8, 95000, 'Medicamentos'],
    [8, 120000, 'Consulta médica'],
    [9, 350000, 'Matrícula curso'],
    [10, 75000, 'Cine y salidas'],
    [11, 220000, 'Ropa y calzado'],
    [12, 0, ''],
    [13, 85000, 'Veterinaria y alimento'],
    [14, 65000, 'Netflix y Spotify'],
    [15, 42000, 'Gastos varios'],
  ]

  expenseSamples.forEach(([catId, base], index) => {
    if (base === 0) return
    addTx(catId, base, 3 + index * 2, expenseSamples[index][2])
    if (index % 3 === 0) {
      addTx(catId, Math.round(base * 0.6), 25 + index, `${expenseSamples[index][2]} (anterior)`)
    }
  })

  addTx(12, 680000, 18, 'Viaje fin de semana', 'manual')
  addTx(12, 420000, 55, 'Vacaciones familiares', 'manual')

  return transactions.sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime(),
  )
}

function filterByPeriod(transactions: Transaction[], period: ChartPeriod): Transaction[] {
  const now = new Date()
  const limits: Record<ChartPeriod, number> = {
    weekly: 7,
    monthly: 30,
    semestral: 180,
  }
  const days = limits[period]
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return transactions.filter((t) => new Date(t.transaction_date) >= cutoff)
}

function sumByType(transactions: Transaction[], type: 'ingreso' | 'gasto'): number {
  const ids = (type === 'ingreso' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => c.id)
  return transactions
    .filter((t) => ids.includes(t.category_id))
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

function buildExpenseByCategory(transactions: Transaction[]): CategoryTotal[] {
  const gastos = filterByPeriod(
    transactions.filter((t) => EXPENSE_CATEGORIES.some((c) => c.id === t.category_id)),
    'monthly',
  )

  return EXPENSE_CATEGORIES.map((cat) => {
    const total = gastos
      .filter((t) => t.category_id === cat.id)
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      total,
      color: getCategoryColor(cat.name, 'gasto'),
    }
  }).filter((c) => c.total > 0)
}

function buildPeriodTrend(transactions: Transaction[], period: ChartPeriod): PeriodDataPoint[] {
  const filtered = filterByPeriod(transactions, period)

  if (period === 'weekly') {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return days.map((label, i) => {
      const dayTx = filtered.filter((t) => new Date(t.transaction_date).getDay() === i)
      const ingresos = sumByType(dayTx, 'ingreso')
      const gastos = sumByType(dayTx, 'gasto')
      return { label, ingresos, gastos, flujo: ingresos - gastos }
    })
  }

  if (period === 'monthly') {
    const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
    return weeks.map((label, i) => {
      const weekTx = filtered.filter((t) => {
        const day = new Date(t.transaction_date).getDate()
        return Math.min(Math.floor((day - 1) / 7), 3) === i
      })
      const ingresos = sumByType(weekTx, 'ingreso')
      const gastos = sumByType(weekTx, 'gasto')
      return { label, ingresos, gastos, flujo: ingresos - gastos }
    })
  }

  const months = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar']
  return months.map((label, i) => {
    const monthTx = filtered.filter((t) => {
      const d = new Date(t.transaction_date)
      return d.getMonth() === ((new Date().getMonth() - 5 + i + 12) % 12)
    })
    const ingresos = sumByType(monthTx, 'ingreso') || (i === 5 ? 3820000 : 3200000 + i * 50000)
    const gastos = sumByType(monthTx, 'gasto') || 2100000 + i * 80000
    return { label, ingresos, gastos, flujo: ingresos - gastos }
  })
}

const ALL_TRANSACTIONS = generateTransactions()

export function getMockDashboard(period: ChartPeriod = 'monthly'): DashboardData {
  const monthlyIncome = sumByType(filterByPeriod(ALL_TRANSACTIONS, 'monthly'), 'ingreso')
  const monthlyExpenses = sumByType(filterByPeriod(ALL_TRANSACTIONS, 'monthly'), 'gasto')

  return {
    user: {
      phone_number: DEMO_PHONE,
      full_name: 'María González',
      created_at: '2025-01-15T10:00:00Z',
    },
    summary: {
      balance: 4850000,
      monthlyIncome,
      monthlyExpenses,
      cashFlow: monthlyIncome - monthlyExpenses,
    },
    expenseByCategory: buildExpenseByCategory(ALL_TRANSACTIONS),
    periodTrend: buildPeriodTrend(ALL_TRANSACTIONS, period),
    transactions: ALL_TRANSACTIONS,
  }
}

export function getMockCategoryTransactions(categoryId: number): Transaction[] {
  return ALL_TRANSACTIONS.filter((t) => t.category_id === categoryId)
}

export function getMockExpenseByPeriod(period: ChartPeriod): CategoryTotal[] {
  const gastos = filterByPeriod(
    ALL_TRANSACTIONS.filter((t) => EXPENSE_CATEGORIES.some((c) => c.id === t.category_id)),
    period,
  )

  return EXPENSE_CATEGORIES.map((cat) => ({
    categoryId: cat.id,
    categoryName: cat.name,
    total: gastos.filter((t) => t.category_id === cat.id).reduce((s, t) => s + Number(t.amount), 0),
    color: getCategoryColor(cat.name, 'gasto'),
  })).filter((c) => c.total > 0)
}
