import { useCallback, useEffect, useState } from 'react'
import { fetchCommercialDashboard } from '../services/commercialApi'
import type { ChartPeriod, CommercialDashboardData } from '../types/commercial'

export function useCommercialDashboard(period: ChartPeriod) {
  const [data, setData] = useState<CommercialDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const dashboard = await fetchCommercialDashboard(period)
      setData(dashboard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
