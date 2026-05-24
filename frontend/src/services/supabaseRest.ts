const SUPABASE_REST_URL = (
  import.meta.env.VITE_SUPABASE_URL ?? 'https://svorevemywtrfqawmcnv.supabase.co/rest/v1'
).replace(/\/$/, '')

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const SUPABASE_SCHEMA = import.meta.env.VITE_SUPABASE_SCHEMA ?? 'public'

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_ANON_KEY)
}

function authHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Accept-Profile': SUPABASE_SCHEMA,
  }
}

export async function fetchSupabaseTable<T>(
  table: string,
  select: string,
  orderBy?: string,
): Promise<T[]> {
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Falta VITE_SUPABASE_ANON_KEY para leer Supabase desde el navegador')
  }

  const url = new URL(`${SUPABASE_REST_URL}/${table}`)
  url.searchParams.set('select', select)
  if (orderBy) {
    url.searchParams.set('order', orderBy)
  }

  const response = await fetch(url.toString(), { headers: authHeaders() })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Supabase ${table}: ${response.status} ${text}`.trim())
  }

  return response.json() as Promise<T[]>
}
