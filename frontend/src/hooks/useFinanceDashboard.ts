import { useCallback, useEffect, useState } from 'react'
import {
  fetchCategoryTransactions,
  fetchDashboard,
  fetchExpenseByPeriod,
} from '../services/financeApi'
import type {
  CategoryTotal,
  ChartPeriod,
  DashboardData,
  Transaction,
} from '../types/finance'

const PHONE_KEY = 'serfinanza_phone'

export function getUserPhone(): string {
  const stored = localStorage.getItem(PHONE_KEY)
  if (stored) return stored
  const phone = '573001234567'
  localStorage.setItem(PHONE_KEY, phone)
  return phone
}

export function useFinanceDashboard(period: ChartPeriod) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [expenses, setExpenses] = useState<CategoryTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const phone = getUserPhone()
      const [dashboard, expenseData] = await Promise.all([
        fetchDashboard(phone, period),
        fetchExpenseByPeriod(phone, period),
      ])
      setData(dashboard)
      setExpenses(expenseData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  return { data, expenses, loading, error, reload: load }
}

export function useCategoryHistory(categoryId: number | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (categoryId === null) {
      setTransactions([])
      return
    }

    let cancelled = false
    setLoading(true)

    fetchCategoryTransactions(getUserPhone(), categoryId)
      .then((txs) => {
        if (!cancelled) setTransactions(txs)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [categoryId])

  return { transactions, loading }
}
