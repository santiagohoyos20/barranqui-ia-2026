export type ChartPeriod = 'weekly' | 'monthly' | 'semestral'

export interface CommercialKpi {
  id: string
  label: string
  value: number
  trend: string
  description: string
  icon: string
  tone: 'emerald' | 'amber' | 'sky' | 'rose' | 'slate'
}

export interface FunnelStage {
  label: string
  value: number
  percent: number
  helper: string
}

export interface ProductMetric {
  product: string
  consultations: number
  appointments: number
  conversionRate: number
}

export interface RejectionReason {
  label: string
  count: number
  share: number
}

export interface RejectedProduct {
  product: string
  count: number
  share: number
}

export interface AbandonmentStep {
  label: string
  count: number
  dropRate: number
}

export interface AssistantMetric {
  label: string
  value: string
  description: string
}

export interface AdvisorMetric {
  id: string
  name: string
  appointments: number
  pendingAppointments: number
  conversionRate: number
  avgDaysToAppointment: number
  noShowRate: number
}

export interface VoiceMetric {
  label: string
  value: string
  description: string
}

export interface TrendPoint {
  label: string
  consultations: number
  interested: number
  appointments: number
}

export interface CommercialDashboardData {
  period: ChartPeriod
  updatedAt: string
  headline: string
  subtitle: string
  executiveNote: string
  kpis: CommercialKpi[]
  funnel: FunnelStage[]
  products: ProductMetric[]
  rejectedProducts: RejectedProduct[]
  rejections: RejectionReason[]
  abandonment: AbandonmentStep[]
  assistant: AssistantMetric[]
  advisors: AdvisorMetric[]
  voice: VoiceMetric[]
  trend: TrendPoint[]
  topQuestions: string[]
  emergingTopics: string[]
}
