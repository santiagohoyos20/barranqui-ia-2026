export type AppointmentStatus = 'pending_confirmation' | 'confirmed' | 'rejected_by_client'

export interface AdvisorMetric {
  id: string
  name: string
  appointments: number
  pendingAppointments: number
  conversionRate: number
  avgDaysToAppointment: number
  noShowRate: number
}

export interface AppointmentDetail {
  id: string
  advisorId: string
  clientName: string
  clientPhone: string
  clientEmail: string | null
  clientIncome: number | null
  clientIdNumber: string | null
  clientStatus: string | null
  productName: string
  productCategory: string | null
  status: AppointmentStatus
  statusLabel: string
  summary: string | null
  scheduledAt: string
  createdAt: string
}

export interface AppointmentsPageData {
  updatedAt: string
  advisors: AdvisorMetric[]
  appointments: AppointmentDetail[]
}
