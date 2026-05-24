import { getMockCommercialDashboard } from '../data/mockCommercial'
import type {
  AdvisorMetric,
  AssistantMetric,
  ChartPeriod,
  CommercialDashboardData,
  ProductMetric,
  RejectedProduct,
  RejectionReason,
  TrendPoint,
} from '../types/commercial'

type ConversationRow = {
  id: string
  user_id: string
  channel: string
  status: 'active' | 'completed' | 'abandoned'
  started_at: string
  ended_at: string | null
}

type MessageRow = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  sent_at: string
}

type ProductRow = {
  id: string
  name: string
  category: string
}

type ProductInterestRow = {
  id: string
  conversation_id: string
  product_id: string
  outcome: 'interested' | 'qualified' | 'rejected' | 'abandoned'
  rejection_reason: 'low_income' | 'age' | 'incomplete_docs' | 'other' | null
  abandonment_step: 'income' | 'id_number' | 'email' | 'name' | 'other' | null
  created_at: string
}

type AppointmentRow = {
  id: string
  user_id: string
  product_id: string
  advisor_id: string
  conversation_id: string
  status: 'pending_confirmation' | 'confirmed' | 'rejected_by_client'
  summary: string | null
  scheduled_at: string
  created_at: string
}

type AdvisorRow = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  created_at: string
}

const SUPABASE_REST_URL = (
  import.meta.env.VITE_SUPABASE_URL ?? 'https://svorevemywtrfqawmcnv.supabase.co/rest/v1'
).replace(/\/$/, '')

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const SUPABASE_SCHEMA = import.meta.env.VITE_SUPABASE_SCHEMA ?? 'public'
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

function formatCount(value: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value)
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

async function fetchTable<T>(table: string, select: string, orderBy?: string): Promise<T[]> {
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Falta VITE_SUPABASE_ANON_KEY para leer Supabase desde el navegador')
  }

  const url = new URL(`${SUPABASE_REST_URL}/${table}`)
  url.searchParams.set('select', select)
  if (orderBy) {
    url.searchParams.set('order', orderBy)
  }

  const response = await fetch(url.toString(), {
    headers: authHeaders(),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Supabase ${table}: ${response.status} ${text}`.trim())
  }

  return response.json() as Promise<T[]>
}

function buildTrendBuckets(period: ChartPeriod, now = new Date()) {
  if (period === 'weekly') {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now)
      date.setDate(date.getDate() - 6 + index)
      const label = date.toLocaleDateString('es-CO', { weekday: 'short' })
      return {
        key: date.toISOString().slice(0, 10),
        label: label.charAt(0).toUpperCase() + label.slice(1),
        consultations: 0,
        interested: 0,
        appointments: 0,
      }
    })
  }

  if (period === 'monthly') {
    return [
      { key: 'week-1', label: 'Semana 1', consultations: 0, interested: 0, appointments: 0 },
      { key: 'week-2', label: 'Semana 2', consultations: 0, interested: 0, appointments: 0 },
      { key: 'week-3', label: 'Semana 3', consultations: 0, interested: 0, appointments: 0 },
      { key: 'week-4', label: 'Semana 4', consultations: 0, interested: 0, appointments: 0 },
    ]
  }

  const monthNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now)
    date.setMonth(date.getMonth() - 5 + index)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: monthNames[date.getMonth()],
      consultations: 0,
      interested: 0,
      appointments: 0,
    }
  })
}

function getBucketIndex(date: Date, period: ChartPeriod, now = new Date()): number {
  if (period === 'weekly') {
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)
    return diff >= 0 && diff < 7 ? 6 - diff : -1
  }

  if (period === 'monthly') {
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)
    return diff >= 0 && diff < 28 ? Math.min(3, Math.floor(diff / 7)) : -1
  }

  const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
  return diffMonths >= 0 && diffMonths < 6 ? 5 - diffMonths : -1
}

function toLocalDateTime(value: string): Date {
  return new Date(value)
}

function distinctCount(values: string[]): number {
  return new Set(values.filter(Boolean)).size
}

function mapProductInterestReasons(rows: ProductInterestRow[]): RejectionReason[] {
  const labels: Record<NonNullable<ProductInterestRow['rejection_reason']>, string> = {
    low_income: 'Ingresos insuficientes',
    age: 'Edad',
    incomplete_docs: 'Documentación incompleta',
    other: 'Otros motivos',
  }

  const counts = new Map<string, number>()
  rows.forEach((row) => {
    if (!row.rejection_reason) return
    const label = labels[row.rejection_reason]
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })

  const total = [...counts.values()].reduce((sum, value) => sum + value, 0) || 1

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      share: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

function mapAbandonment(rows: ProductInterestRow[]) {
  const labels: Record<NonNullable<ProductInterestRow['abandonment_step']>, string> = {
    income: 'Ingreso',
    id_number: 'Identificación',
    email: 'Correo',
    name: 'Nombre',
    other: 'Otro',
  }

  const counts = new Map<string, number>()
  rows.forEach((row) => {
    if (!row.abandonment_step) return
    const label = labels[row.abandonment_step]
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })

  const total = [...counts.values()].reduce((sum, value) => sum + value, 0) || 1

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      dropRate: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

function buildAssistantMetrics(conversations: ConversationRow[], messages: MessageRow[], appointments: AppointmentRow[]): AssistantMetric[] {
  const durations = conversations
    .filter((conversation) => conversation.ended_at)
    .map((conversation) => {
      const started = new Date(conversation.started_at).getTime()
      const ended = new Date(conversation.ended_at as string).getTime()
      return Math.max(0, (ended - started) / 60000)
    })

  const averageDuration = durations.length
    ? durations.reduce((sum, value) => sum + value, 0) / durations.length
    : 0

  const messagesPerConversation = conversations.length ? messages.length / conversations.length : 0
  const resolvedConversations = conversations.filter((conversation) => conversation.status === 'completed').length
  const escalatedConversations = distinctCount(appointments.map((appointment) => appointment.conversation_id))

  return [
    {
      label: 'Tiempo promedio',
      value: `${averageDuration.toFixed(1)} min`,
      description: 'Duración media de conversaciones cerradas.',
    },
    {
      label: 'Mensajes por conversación',
      value: messagesPerConversation.toFixed(1),
      description: 'Profundidad promedio del diálogo.',
    },
    {
      label: 'Resolución sin asesor',
      value: `${conversations.length ? Math.round((resolvedConversations / conversations.length) * 100) : 0}%`,
      description: 'Conversaciones completadas por el bot.',
    },
    {
      label: 'Escalamiento a asesor',
      value: `${conversations.length ? Math.round((escalatedConversations / conversations.length) * 100) : 0}%`,
      description: 'Conversaciones que terminaron en cita.',
    },
  ]
}

function buildAdvisorMetrics(appointments: AppointmentRow[], advisors: AdvisorRow[]): AdvisorMetric[] {
  const advisorById = new Map(advisors.map((advisor) => [advisor.id, advisor]))
  const grouped = new Map<string, AppointmentRow[]>()

  appointments.forEach((appointment) => {
    if (appointment.status !== 'confirmed') return
    const list = grouped.get(appointment.advisor_id) ?? []
    list.push(appointment)
    grouped.set(appointment.advisor_id, list)
  })

  return [...grouped.entries()]
    .map(([advisorId, rows]) => {
      const totalAppointments = rows.length
      const noShows = appointments.filter(
        (appointment) => appointment.advisor_id === advisorId && appointment.status === 'rejected_by_client',
      ).length

      const avgDaysToAppointment = totalAppointments
        ? rows.reduce((sum, appointment) => {
            const created = new Date(appointment.created_at).getTime()
            const scheduled = new Date(appointment.scheduled_at).getTime()
            return sum + Math.max(0, (scheduled - created) / 86400000)
          }, 0) / totalAppointments
        : 0

      const advisor = advisorById.get(advisorId)

      return {
        name: advisor?.name ?? 'Sin asignar',
        appointments: totalAppointments,
        conversionRate: totalAppointments ? Math.round(100 * totalAppointments / appointments.length) : 0,
        avgDaysToAppointment: Number(avgDaysToAppointment.toFixed(1)),
        noShowRate: appointments.length ? Math.round((noShows / appointments.length) * 100) : 0,
      }
    })
    .sort((a, b) => b.appointments - a.appointments)
}

function buildProductMetrics(
  products: ProductRow[],
  productInterests: ProductInterestRow[],
  appointments: AppointmentRow[],
): ProductMetric[] {
  const productById = new Map(products.map((product) => [product.id, product.name]))
  const consultationCounts = new Map<string, number>()
  const appointmentCounts = new Map<string, number>()

  productInterests.forEach((interest) => {
    const productName = productById.get(interest.product_id) ?? 'Producto sin nombre'
    consultationCounts.set(productName, (consultationCounts.get(productName) ?? 0) + 1)
  })

  appointments.forEach((appointment) => {
    if (appointment.status !== 'confirmed') return
    const productName = productById.get(appointment.product_id) ?? 'Producto sin nombre'
    appointmentCounts.set(productName, (appointmentCounts.get(productName) ?? 0) + 1)
  })

  return [...consultationCounts.entries()]
    .map(([product, consultations]) => {
      const appointmentsCount = appointmentCounts.get(product) ?? 0
      return {
        product,
        consultations,
        appointments: appointmentsCount,
        conversionRate: consultations ? Number(((appointmentsCount / consultations) * 100).toFixed(1)) : 0,
      }
    })
    .sort((a, b) => b.consultations - a.consultations)
}

function buildRejectedProducts(products: ProductRow[], productInterests: ProductInterestRow[]): RejectedProduct[] {
  const productById = new Map(products.map((product) => [product.id, product.name]))
  const counts = new Map<string, number>()

  productInterests
    .filter((interest) => interest.outcome === 'rejected')
    .forEach((interest) => {
      const productName = productById.get(interest.product_id) ?? 'Producto sin nombre'
      counts.set(productName, (counts.get(productName) ?? 0) + 1)
    })

  const total = [...counts.values()].reduce((sum, value) => sum + value, 0) || 1

  return [...counts.entries()]
    .map(([product, count]) => ({
      product,
      count,
      share: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

function buildTrend(
  period: ChartPeriod,
  conversations: ConversationRow[],
  productInterests: ProductInterestRow[],
  appointments: AppointmentRow[],
): TrendPoint[] {
  const now = new Date()
  const buckets = buildTrendBuckets(period, now)

  conversations.forEach((conversation) => {
    const date = toLocalDateTime(conversation.started_at)
    const index = getBucketIndex(date, period, now)
    if (index < 0 || !buckets[index]) return
    buckets[index].consultations += 1
  })

  productInterests.forEach((interest) => {
    const date = toLocalDateTime(interest.created_at)
    const index = getBucketIndex(date, period, now)
    if (index < 0 || !buckets[index]) return
    buckets[index].interested += 1
  })

  appointments.forEach((appointment) => {
    if (appointment.status !== 'confirmed') return
    const date = toLocalDateTime(appointment.created_at)
    const index = getBucketIndex(date, period, now)
    if (index < 0 || !buckets[index]) return
    buckets[index].appointments += 1
  })

  return buckets.map(({ label, consultations, interested, appointments: appointmentCount }) => ({
    label,
    consultations,
    interested,
    appointments: appointmentCount,
  }))
}

function buildCommercialDashboardFromSupabase(
  period: ChartPeriod,
  conversations: ConversationRow[],
  messages: MessageRow[],
  products: ProductRow[],
  productInterests: ProductInterestRow[],
  appointments: AppointmentRow[],
  advisors: AdvisorRow[],
): CommercialDashboardData {
  const uniqueUsers = distinctCount(conversations.map((conversation) => conversation.user_id))
  const interestedUsers = distinctCount(
    productInterests.map((interest) => {
      const conversation = conversations.find((entry) => entry.id === interest.conversation_id)
      return conversation?.user_id ?? ''
    }),
  )

  const qualifiedUsers = distinctCount(
    productInterests
      .filter((interest) => interest.outcome === 'qualified')
      .map((interest) => {
        const conversation = conversations.find((entry) => entry.id === interest.conversation_id)
        return conversation?.user_id ?? ''
      }),
  )

  const confirmedAppointments = appointments.filter((appointment) => appointment.status === 'confirmed')
  const appointmentUsers = distinctCount(confirmedAppointments.map((appointment) => appointment.user_id))
  const conversationsInitiated = conversations.length

  const productMetrics = buildProductMetrics(products, productInterests, appointments)
  const rejectedProducts = buildRejectedProducts(products, productInterests)
  const rejectionMetrics = mapProductInterestReasons(productInterests.filter((interest) => interest.outcome === 'rejected'))
  const abandonmentMetrics = mapAbandonment(productInterests.filter((interest) => interest.outcome === 'abandoned'))
  const assistantMetrics = buildAssistantMetrics(conversations, messages, appointments)
  const advisorMetrics = buildAdvisorMetrics(appointments, advisors)
  const trend = buildTrend(period, conversations, productInterests, appointments)

  const sortedByConsultation = [...productMetrics].sort((a, b) => b.consultations - a.consultations)
  const topQuestions = sortedByConsultation.slice(0, 5).map(
    (product) => `${product.product} · ${formatCount(product.consultations)} consultas`,
  )

  const emergingTopics = rejectionMetrics.slice(0, 3).map((item) => item.label)

  const allTimestamps = [
    ...conversations.map((row) => row.started_at),
    ...productInterests.map((row) => row.created_at),
    ...appointments.map((row) => row.created_at),
  ]
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value))

  const latestTimestamp = allTimestamps.length ? Math.max(...allTimestamps) : Date.now()

  return {
    period,
    updatedAt: new Date(latestTimestamp).toISOString(),
    headline: 'Dashboard comercial de leads',
    subtitle: 'El foco está en interés, precalificación, citas y fricción del flujo conversacional.',
    executiveNote:
      'Este tablero está pensado para gerencia comercial: muestra quién llega, qué producto quiere, dónde abandona y qué tan bien convierte el asistente.',
    kpis: [
      {
        id: 'unique-users',
        label: 'Usuarios únicos atendidos',
        value: uniqueUsers,
        trend: `${formatCount(uniqueUsers)} usuarios distintos en el periodo`,
        description: 'Personas únicas que conversaron con el asistente.',
        icon: '👥',
        tone: 'sky',
      },
      {
        id: 'conversations',
        label: 'Conversaciones iniciadas',
        value: conversationsInitiated,
        trend: `${formatCount(conversationsInitiated)} sesiones registradas`,
        description: 'Conversaciones totales iniciadas por usuarios.',
        icon: '💬',
        tone: 'emerald',
      },
      {
        id: 'prequalified-users',
        label: 'Usuarios precalificados',
        value: qualifiedUsers,
        trend: 'Aptos sin cita confirmada',
        description: 'Usuarios que el agente determinó como aptos pero no confirmaron la cita.',
        icon: '✅',
        tone: 'amber',
      },
      {
        id: 'appointments',
        label: 'Citas agendadas',
        value: appointmentUsers,
        trend: 'Aptos con cita confirmada',
        description: 'Usuarios aptos que sí confirmaron la cita.',
        icon: '📅',
        tone: 'rose',
      },
      {
        id: 'conversion',
        label: 'Tasa de conversión',
        value: interestedUsers ? Number(((appointmentUsers / interestedUsers) * 100).toFixed(1)) : 0,
        trend: 'citas agendadas / usuarios interesados',
        description: 'Relación entre citas agendadas y usuarios interesados.',
        icon: '📈',
        tone: 'slate',
      },
    ],
    funnel: [
      {
        label: 'Usuarios atendidos',
        value: uniqueUsers,
        percent: 100,
        helper: 'Personas únicas que conversaron con el asistente.',
      },
      {
        label: 'Conversaciones iniciadas',
        value: conversationsInitiated,
        percent: uniqueUsers ? Math.round((conversationsInitiated / uniqueUsers) * 100) : 0,
        helper: 'Sesiones totales iniciadas, incluyendo usuarios repetidos.',
      },
      {
        label: 'Usuarios interesados',
        value: interestedUsers,
        percent: uniqueUsers ? Math.round((interestedUsers / uniqueUsers) * 100) : 0,
        helper: 'Usuarios que preguntaron por al menos un producto.',
      },
      {
        label: 'Usuarios precalificados',
        value: qualifiedUsers,
        percent: interestedUsers ? Math.round((qualifiedUsers / interestedUsers) * 100) : 0,
        helper: 'Casos aptos, pero sin cita confirmada.',
      },
      {
        label: 'Citas agendadas',
        value: appointmentUsers,
        percent: interestedUsers ? Math.round((appointmentUsers / interestedUsers) * 100) : 0,
        helper: 'Oportunidades con cita confirmada.',
      },
    ],
    products: productMetrics,
    rejectedProducts,
    rejections: rejectionMetrics,
    abandonment: abandonmentMetrics,
    assistant: assistantMetrics,
    advisors: advisorMetrics,
    voice: [
      {
        label: 'Canales activos',
        value: formatCount(distinctCount(conversations.map((conversation) => conversation.channel))),
        description: 'Canales distintos usados por los usuarios.',
      },
      {
        label: 'Canal principal',
        value: (() => {
          const counts = new Map<string, number>()
          conversations.forEach((conversation) => {
            counts.set(conversation.channel, (counts.get(conversation.channel) ?? 0) + 1)
          })
          return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/D'
        })(),
        description: 'Canal con más conversaciones.',
      },
      {
        label: 'Conversaciones por voz',
        value: `${(() => {
          const voiceCount = conversations.filter((conversation) => /voice|audio|voz/i.test(conversation.channel)).length
          return conversations.length ? Math.round((voiceCount / conversations.length) * 100) : 0
        })()}%`,
        description: 'Participación estimada del canal de voz.',
      },
    ],
    trend,
    topQuestions,
    emergingTopics,
  }
}

async function loadLiveCommercialDashboard(period: ChartPeriod): Promise<CommercialDashboardData> {
  const [conversations, messages, products, productInterests, appointments, advisors] = await Promise.all([
    fetchTable<ConversationRow>('conversations', 'id,user_id,channel,status,started_at,ended_at', 'started_at.asc'),
    fetchTable<MessageRow>('messages', 'id,conversation_id,role,content,sent_at', 'sent_at.asc'),
    fetchTable<ProductRow>('products', 'id,name,category', 'created_at.asc'),
    fetchTable<ProductInterestRow>(
      'product_interests',
      'id,conversation_id,product_id,outcome,rejection_reason,abandonment_step,created_at',
      'created_at.asc',
    ),
    fetchTable<AppointmentRow>(
      'appointments',
      'id,user_id,product_id,advisor_id,conversation_id,status,summary,scheduled_at,created_at',
      'created_at.asc',
    ),
    fetchTable<AdvisorRow>('advisors', 'id,name,email,role,active,created_at', 'created_at.asc'),
  ])

  return buildCommercialDashboardFromSupabase(period, conversations, messages, products, productInterests, appointments, advisors)
}

export async function fetchCommercialDashboard(period: ChartPeriod): Promise<CommercialDashboardData> {
  try {
    return await loadLiveCommercialDashboard(period)
  } catch (error) {
    if (USE_MOCK) {
      return getMockCommercialDashboard(period)
    }

    const message = error instanceof Error ? error.message : 'No se pudo cargar el dashboard comercial'
    throw new Error(message)
  }
}
