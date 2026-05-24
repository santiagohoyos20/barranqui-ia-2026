import { useCallback, useEffect, useState } from 'react'
import { fetchAppointmentsPageData } from '../services/appointmentsApi'
import type { AppointmentsPageData } from '../types/appointments'

export function useAppointments() {
  const [data, setData] = useState<AppointmentsPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const pageData = await fetchAppointmentsPageData()
      setData(pageData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
