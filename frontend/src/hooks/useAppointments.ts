import { useCallback, useEffect, useState } from 'react'
import { DASHBOARD_POLL_INTERVAL_MS } from '../constants/polling'
import { fetchAppointmentsPageData } from '../services/appointmentsApi'
import type { AppointmentsPageData } from '../types/appointments'

export function useAppointments() {
  const [data, setData] = useState<AppointmentsPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const pageData = await fetchAppointmentsPageData()
      setData(pageData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las citas')
    } finally {
      if (silent) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [])

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
