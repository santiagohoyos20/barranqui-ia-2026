import { useCallback, useEffect, useState } from 'react'
import { DASHBOARD_POLL_INTERVAL_MS } from '../constants/polling'
import { fetchCommercialDashboard } from '../services/commercialApi'
import type { ChartPeriod, CommercialDashboardData } from '../types/commercial'

export function useCommercialDashboard(period: ChartPeriod) {
  const [data, setData] = useState<CommercialDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const dashboard = await fetchCommercialDashboard(period)
        setData(dashboard)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el dashboard')
      } finally {
        if (silent) {
          setRefreshing(false)
        } else {
          setLoading(false)
        }
      }
    },
    [period],
  )

  useEffect(() => {
    void load(false)
    const intervalId = window.setInterval(() => {
      void load(true)
    }, DASHBOARD_POLL_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [load])

  const reload = useCallback(() => load(Boolean(data)), [data, load])

  return { data, loading, refreshing, error, reload }
}
