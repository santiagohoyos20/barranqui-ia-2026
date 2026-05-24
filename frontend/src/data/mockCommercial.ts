import type {
  AssistantMetric,
  AdvisorMetric,
  AbandonmentStep,
  ChartPeriod,
  CommercialDashboardData,
  FunnelStage,
  ProductMetric,
  RejectedProduct,
  RejectionReason,
  TrendPoint,
  VoiceMetric,
} from '../types/commercial'

const BASE_KPIS = {
  uniqueUsers: 2340,
  conversations: 4850,
  interestedUsers: 1820,
  prequalifiedUsers: 950,
  appointments: 420,
}

function buildTrend(period: ChartPeriod): TrendPoint[] {
  if (period === 'weekly') {
    return [
      { label: 'Lun', consultations: 120, interested: 56, appointments: 11 },
      { label: 'Mar', consultations: 145, interested: 68, appointments: 14 },
      { label: 'Mié', consultations: 132, interested: 61, appointments: 12 },
      { label: 'Jue', consultations: 178, interested: 83, appointments: 18 },
      { label: 'Vie', consultations: 190, interested: 90, appointments: 21 },
      { label: 'Sáb', consultations: 102, interested: 44, appointments: 8 },
      { label: 'Dom', consultations: 88, interested: 39, appointments: 6 },
    ]
  }

  if (period === 'monthly') {
    return [
      { label: 'Semana 1', consultations: 520, interested: 224, appointments: 51 },
      { label: 'Semana 2', consultations: 610, interested: 257, appointments: 63 },
      { label: 'Semana 3', consultations: 655, interested: 282, appointments: 72 },
      { label: 'Semana 4', consultations: 575, interested: 242, appointments: 68 },
    ]
  }

  return [
    { label: 'Ene', consultations: 1630, interested: 692, appointments: 154 },
    { label: 'Feb', consultations: 1710, interested: 728, appointments: 169 },
    { label: 'Mar', consultations: 1825, interested: 783, appointments: 177 },
    { label: 'Abr', consultations: 1930, interested: 812, appointments: 186 },
    { label: 'May', consultations: 2015, interested: 842, appointments: 198 },
    { label: 'Jun', consultations: 2140, interested: 901, appointments: 214 },
  ]
}

function buildFunnel(): FunnelStage[] {
  return [
    {
      label: 'Usuarios atendidos',
      value: BASE_KPIS.uniqueUsers,
      percent: 100,
      helper: 'Personas únicas que conversaron con el asistente.',
    },
    {
      label: 'Conversaciones iniciadas',
      value: BASE_KPIS.conversations,
      percent: 72,
      helper: 'Sesiones totales activadas durante el periodo.',
    },
    {
      label: 'Interesados en productos',
      value: BASE_KPIS.interestedUsers,
      percent: 78,
      helper: 'Usuarios que preguntaron por al menos un producto.',
    },
    {
      label: 'Usuarios precalificados',
      value: BASE_KPIS.prequalifiedUsers,
      percent: 52,
      helper: 'Casos con criterios mínimos para avanzar.',
    },
    {
      label: 'Citas agendadas',
      value: BASE_KPIS.appointments,
      percent: 23,
      helper: 'Oportunidades comerciales listas para seguimiento.',
    },
  ]
}

function buildProducts(): ProductMetric[] {
  return [
    { product: 'Crédito de libre inversión', consultations: 530, appointments: 120, conversionRate: 22.6 },
    { product: 'Tarjeta de crédito', consultations: 420, appointments: 70, conversionRate: 16.7 },
    { product: 'Crédito de vivienda', consultations: 380, appointments: 140, conversionRate: 36.8 },
    { product: 'CDT', consultations: 210, appointments: 25, conversionRate: 11.9 },
    { product: 'Seguros', consultations: 165, appointments: 28, conversionRate: 17.0 },
  ]
}

function buildRejections(): RejectionReason[] {
  const items = [
    ['Ingresos insuficientes', 180],
    ['Historial crediticio', 130],
    ['Antigüedad laboral', 96],
    ['Edad', 62],
    ['Documentación incompleta', 54],
  ] as const

  const total = items.reduce((sum, [, count]) => sum + count, 0)

  return items.map(([label, count]) => ({
    label,
    count,
    share: Math.round((count / total) * 100),
  }))
}

function buildRejectedProducts(): RejectedProduct[] {
  const items = [
    ['Crédito de vivienda', 84],
    ['Tarjeta de crédito', 61],
    ['Crédito de libre inversión', 47],
    ['CDT', 24],
    ['Seguros', 19],
  ] as const

  const total = items.reduce((sum, [, count]) => sum + count, 0)

  return items.map(([product, count]) => ({
    product,
    count,
    share: Math.round((count / total) * 100),
  }))
}

function buildAbandonment(): AbandonmentStep[] {
  return [
    { label: 'Ingresos', count: 30, dropRate: 30 },
    { label: 'Identificación', count: 20, dropRate: 20 },
    { label: 'Correo electrónico', count: 15, dropRate: 15 },
    { label: 'Validación de datos', count: 12, dropRate: 12 },
  ]
}

function buildAssistantMetrics(): AssistantMetric[] {
  return [
    { label: 'Tiempo promedio', value: '4 min 20 seg', description: 'Duración media de conversación.' },
    { label: 'Mensajes por conversación', value: '18', description: 'Nivel de profundidad del diálogo.' },
    { label: 'Resolución sin asesor', value: '78%', description: 'Casos resueltos por el bot.' },
    { label: 'Escalamiento a asesor', value: '22%', description: 'Conversaciones derivadas a un humano.' },
  ]
}

function buildAdvisors(): AdvisorMetric[] {
  return [
    { name: 'Ana', appointments: 52, conversionRate: 31, avgDaysToAppointment: 1.5, noShowRate: 10 },
    { name: 'Carlos', appointments: 47, conversionRate: 27, avgDaysToAppointment: 1.9, noShowRate: 12 },
    { name: 'Laura', appointments: 43, conversionRate: 25, avgDaysToAppointment: 2.1, noShowRate: 16 },
  ]
}

function buildVoiceMetrics(): VoiceMetric[] {
  return [
    { label: 'Conversaciones por voz', value: '35%', description: 'Participación del canal de voz.' },
    { label: 'Duración media de audios', value: '22 segundos', description: 'Promedio de respuestas habladas.' },
    { label: 'Conversión voz vs texto', value: '31% vs 18%', description: 'La voz convierte mejor que el chat.' },
  ]
}

export function getMockCommercialDashboard(period: ChartPeriod = 'monthly'): CommercialDashboardData {
  return {
    period,
    updatedAt: '2026-05-23T12:00:00Z',
    headline: 'Dashboard comercial de leads',
    subtitle: 'El foco está en interés, precalificación, citas y fricción del flujo conversacional.',
    executiveNote:
      'Este tablero está pensado para gerencia comercial: muestra quién llega, qué producto quiere, dónde abandona y qué tan bien convierte el asistente.',
    kpis: [
      {
        id: 'unique-users',
        label: 'Usuarios únicos atendidos',
        value: BASE_KPIS.uniqueUsers,
        trend: '+12% vs periodo anterior',
        description: 'Personas únicas que interactuaron con el bot.',
        icon: '👥',
        tone: 'sky',
      },
      {
        id: 'interested-users',
        label: 'Usuarios interesados',
        value: BASE_KPIS.interestedUsers,
        trend: '38% del tráfico total',
        description: 'Usuarios que preguntaron por al menos un producto.',
        icon: '🎯',
        tone: 'emerald',
      },
      {
        id: 'prequalified-users',
        label: 'Usuarios precalificados',
        value: BASE_KPIS.prequalifiedUsers,
        trend: '52% del embudo',
        description: 'Casos con criterios mínimos para avanzar.',
        icon: '✅',
        tone: 'amber',
      },
      {
        id: 'appointments',
        label: 'Citas agendadas',
        value: BASE_KPIS.appointments,
        trend: '23% de interesados',
        description: 'Oportunidades comerciales listas para seguimiento.',
        icon: '📅',
        tone: 'rose',
      },
      {
        id: 'conversion',
        label: 'Tasa de conversión',
        value: 23,
        trend: 'citas / interesados',
        description: 'Relación entre oportunidades y citas generadas.',
        icon: '📈',
        tone: 'slate',
      },
    ],
    funnel: buildFunnel(),
    products: buildProducts(),
    rejectedProducts: buildRejectedProducts(),
    rejections: buildRejections(),
    abandonment: buildAbandonment(),
    assistant: buildAssistantMetrics(),
    advisors: buildAdvisors(),
    voice: buildVoiceMetrics(),
    trend: buildTrend(period),
    topQuestions: ['Requisitos crédito vivienda', 'Activación de tarjeta', 'CDT', 'Tasas de interés', 'PSE'],
    emergingTopics: ['Aumento reciente de consultas sobre CDT', 'Crédito educativo', 'Seguros'],
  }
}
