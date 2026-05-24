export type ProductInterest =
  | 'CDT'
  | 'Cuenta de Ahorros'
  | 'Crédito Personal'
  | 'Crédito Empresarial'
  | 'Tarjeta de Crédito'
  | 'Leasing'
  | 'Seguro de Vida'
  | 'Otro';

export type IntentType =
  | 'informacion'
  | 'cotizacion'
  | 'solicitud_cita'
  | 'queja'
  | 'otro';

export type RejectionReason = 'low_income' | 'age' | 'incomplete_docs' | 'other';
export type AbandonmentStep = 'income' | 'id_number' | 'email' | 'name' | 'other';

export interface ExtractedUserData {
  name?: string;
  phone?: string;
  email?: string;
}

export interface AppointmentRequest {
  detected: boolean;
  preferredTime?: string;
  notes?: string;
}

export interface ExtractedIntelligence {
  userData: ExtractedUserData;
  productInterests: ProductInterest[];
  intentType: IntentType;
  rejectionReason?: RejectionReason;
  abandonmentStep?: AbandonmentStep;
  appointmentRequest: AppointmentRequest;
  summary: string;
}
