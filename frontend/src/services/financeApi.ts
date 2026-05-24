import {
  getMockCategoryTransactions,
  getMockDashboard,
  getMockExpenseByPeriod,
} from '../data/mockFinance'
import type { CategoryTotal, ChartPeriod, DashboardData, Transaction } from '../types/finance'

const FINANCE_API =
  import.meta.env.VITE_FINANCE_API_URL ?? 'http://localhost:3000/api/finance'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export async function fetchDashboard(
  phone: string,
  period: ChartPeriod,
): Promise<DashboardData> {
  const data = await fetchJson<DashboardData>(
    `${FINANCE_API}/dashboard?phone=${encodeURIComponent(phone)}&period=${period}`,
  )
  if (data) return data

  if (USE_MOCK) {
    const mock = getMockDashboard(period)
    return {
      ...mock,
      expenseByCategory: getMockExpenseByPeriod(period),
      periodTrend: mock.periodTrend,
    }
  }

  throw new Error('No se pudo cargar el dashboard financiero')
}

export async function fetchCategoryTransactions(
  phone: string,
  categoryId: number,
): Promise<Transaction[]> {
  const data = await fetchJson<Transaction[]>(
    `${FINANCE_API}/transactions?phone=${encodeURIComponent(phone)}&categoryId=${categoryId}`,
  )
  if (data) return data

  if (USE_MOCK) return getMockCategoryTransactions(categoryId)

  throw new Error('No se pudo cargar el historial')
}

export async function fetchExpenseByPeriod(
  phone: string,
  period: ChartPeriod,
): Promise<CategoryTotal[]> {
  const data = await fetchJson<CategoryTotal[]>(
    `${FINANCE_API}/expenses?phone=${encodeURIComponent(phone)}&period=${period}`,
  )
  if (data) return data

  if (USE_MOCK) return getMockExpenseByPeriod(period)

  throw new Error('No se pudieron cargar los gastos')
}
