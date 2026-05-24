import { getMockCommercialDashboard } from '../data/mockCommercial'
import type { ChartPeriod, CommercialDashboardData } from '../types/commercial'

const COMMERCIAL_API =
  import.meta.env.VITE_COMMERCIAL_API_URL ?? 'http://localhost:3000/api/commercial'

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

export async function fetchCommercialDashboard(period: ChartPeriod): Promise<CommercialDashboardData> {
  const data = await fetchJson<CommercialDashboardData>(`${COMMERCIAL_API}/dashboard?period=${period}`)

  if (data) return data

  if (USE_MOCK) return getMockCommercialDashboard(period)

  throw new Error('No se pudo cargar el dashboard comercial')
}
