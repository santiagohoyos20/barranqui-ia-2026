import type {
  AdvisorMetric,
  AppointmentDetail,
  AppointmentStatus,
  AppointmentsPageData,
} from '../types/appointments'
import { fetchSupabaseTable } from './supabaseRest'

type AppointmentRow = {
  id: string
  user_id: string
  product_id: string
  advisor_id: string
  conversation_id: string
  status: AppointmentStatus
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
}

type ProductRow = {
  id: string
  name: string
  category: string
}

type UserRow = {
  id: string
  phone: string
  name?: string | null
  full_name?: string | null
  email?: string | null
  monthly_income?: number | null
  id_number?: string | null
  status?: string | null
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending_confirmation: 'Pendiente de confirmación',
  confirmed: 'Confirmada',
  rejected_by_client: 'Rechazada por el cliente',
}

function buildAdvisorMetrics(appointments: AppointmentRow[], advisors: AdvisorRow[]): AdvisorMetric[] {
  const confirmedTotal = appointments.filter((row) => row.status === 'confirmed').length

  return advisors
    .filter((advisor) => advisor.active)
    .map((advisor) => {
      const advisorAppointments = appointments.filter((row) => row.advisor_id === advisor.id)
      const confirmed = advisorAppointments.filter((row) => row.status === 'confirmed')
      const pending = advisorAppointments.filter((row) => row.status === 'pending_confirmation')
      const noShows = advisorAppointments.filter((row) => row.status === 'rejected_by_client')

      const avgDaysToAppointment = confirmed.length
        ? confirmed.reduce((sum, row) => {
            const created = new Date(row.created_at).getTime()
            const scheduled = new Date(row.scheduled_at).getTime()
            return sum + Math.max(0, (scheduled - created) / 86400000)
          }, 0) / confirmed.length
        : 0

      return {
        id: advisor.id,
        name: advisor.name,
        appointments: confirmed.length,
        pendingAppointments: pending.length,
        conversionRate: confirmedTotal
          ? Math.round((confirmed.length / confirmedTotal) * 100)
          : 0,
        avgDaysToAppointment: Number(avgDaysToAppointment.toFixed(1)),
        noShowRate: advisorAppointments.length
          ? Math.round((noShows.length / advisorAppointments.length) * 100)
          : 0,
      }
    })
    .sort((a, b) => b.appointments - a.appointments)
}

function buildAppointmentDetails(
  appointments: AppointmentRow[],
  users: UserRow[],
  products: ProductRow[],
): AppointmentDetail[] {
  const userById = new Map(users.map((user) => [user.id, user]))
  const productById = new Map(products.map((product) => [product.id, product]))

  return appointments
    .map((appointment) => {
      const user = userById.get(appointment.user_id)
      const product = productById.get(appointment.product_id)

      return {
        id: appointment.id,
        advisorId: appointment.advisor_id,
        clientName: user?.name ?? user?.full_name ?? 'Cliente sin nombre',
        clientPhone: user?.phone ?? '—',
        clientEmail: user?.email ?? null,
        clientIncome: user?.monthly_income ?? null,
        clientIdNumber: user?.id_number ?? null,
        clientStatus: user?.status ?? null,
        productName: product?.name ?? 'Producto sin nombre',
        productCategory: product?.category ?? null,
        status: appointment.status,
        statusLabel: STATUS_LABELS[appointment.status],
        summary: appointment.summary,
        scheduledAt: appointment.scheduled_at,
        createdAt: appointment.created_at,
      }
    })
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
}

function getMockAppointmentsData(): AppointmentsPageData {
  const advisors: AdvisorMetric[] = [
    {
      id: 'advisor-ana',
      name: 'Ana',
      appointments: 2,
      pendingAppointments: 1,
      conversionRate: 40,
      avgDaysToAppointment: 1.5,
      noShowRate: 0,
    },
    {
      id: 'advisor-carlos',
      name: 'Carlos',
      appointments: 1,
      pendingAppointments: 0,
      conversionRate: 20,
      avgDaysToAppointment: 2.1,
      noShowRate: 0,
    },
  ]

  const appointments: AppointmentDetail[] = [
    {
      id: 'apt-1',
      advisorId: 'advisor-ana',
      clientName: 'María González',
      clientPhone: '3001234567',
      clientEmail: 'maria@example.com',
      clientIncome: 3200000,
      clientIdNumber: '1234567890',
      clientStatus: 'qualified',
      productName: 'Crédito de vivienda',
      productCategory: 'credito',
      status: 'confirmed',
      statusLabel: STATUS_LABELS.confirmed,
      summary: 'Interesada en crédito de vivienda, documentación completa.',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt-2',
      advisorId: 'advisor-ana',
      clientName: 'Juan Pérez',
      clientPhone: '3009876543',
      clientEmail: 'juan@example.com',
      clientIncome: 2400000,
      clientIdNumber: '9876543210',
      clientStatus: 'qualified',
      productName: 'CDT',
      productCategory: 'inversion',
      status: 'pending_confirmation',
      statusLabel: STATUS_LABELS.pending_confirmation,
      summary: 'Quiere invertir en CDT, pendiente confirmar horario.',
      scheduledAt: new Date(Date.now() + 172800000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt-3',
      advisorId: 'advisor-carlos',
      clientName: 'Laura Quintero',
      clientPhone: '3015558899',
      clientEmail: 'laura@example.com',
      clientIncome: 1800000,
      clientIdNumber: '1122334455',
      clientStatus: 'qualified',
      productName: 'Crédito de libre inversión',
      productCategory: 'credito',
      status: 'confirmed',
      statusLabel: STATUS_LABELS.confirmed,
      summary: 'Solicita crédito de libre inversión para remodelación.',
      scheduledAt: new Date(Date.now() + 259200000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ]

  return {
    updatedAt: new Date().toISOString(),
    advisors,
    appointments,
  }
}

export async function fetchAppointmentsPageData(): Promise<AppointmentsPageData> {
  const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

  try {
    const [appointments, advisors, products, users] = await Promise.all([
      fetchSupabaseTable<AppointmentRow>(
        'appointments',
        'id,user_id,product_id,advisor_id,conversation_id,status,summary,scheduled_at,created_at',
        'scheduled_at.desc',
      ),
      fetchSupabaseTable<AdvisorRow>('advisors', 'id,name,email,role,active', 'name.asc'),
      fetchSupabaseTable<ProductRow>('products', 'id,name,category', 'name.asc'),
      fetchSupabaseTable<UserRow>(
        'users',
        'id,phone,name,email,monthly_income,id_number,status',
        'created_at.asc',
      ),
    ])

    const timestamps = appointments.map((row) => new Date(row.created_at).getTime())
    const latestTimestamp = timestamps.length ? Math.max(...timestamps) : Date.now()

    return {
      updatedAt: new Date(latestTimestamp).toISOString(),
      advisors: buildAdvisorMetrics(appointments, advisors),
      appointments: buildAppointmentDetails(appointments, users, products),
    }
  } catch (error) {
    if (USE_MOCK) {
      return getMockAppointmentsData()
    }

    throw error instanceof Error ? error : new Error('No se pudieron cargar las citas')
  }
}
