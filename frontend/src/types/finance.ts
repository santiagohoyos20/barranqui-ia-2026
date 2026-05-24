export type CategoryType = 'ingreso' | 'gasto'

export type ChartPeriod = 'weekly' | 'monthly' | 'semestral'

export interface User {
  phone_number: string
  full_name: string | null
  created_at: string
}

export interface Category {
  id: number
  name: string
  type: CategoryType
}

export interface Transaction {
  id: string
  user_phone: string
  category_id: number
  amount: number
  description: string | null
  transaction_date: string
  source: string | null
  created_at: string
}

export interface FinancialSummary {
  balance: number
  monthlyIncome: number
  monthlyExpenses: number
  cashFlow: number
}

export interface CategoryTotal {
  categoryId: number
  categoryName: string
  total: number
  color: string
}

export interface PeriodDataPoint {
  label: string
  ingresos: number
  gastos: number
  flujo: number
}

export interface DashboardData {
  user: User
  summary: FinancialSummary
  expenseByCategory: CategoryTotal[]
  periodTrend: PeriodDataPoint[]
  transactions: Transaction[]
}
