export interface UserDataUpdate {
  name?: string;
  email?: string;
  monthly_income?: number;
  id_number?: string;
  status?: 'prospect' | 'qualified' | 'rejected';
}

export type ProductOutcome = 'interested' | 'qualified' | 'rejected' | 'abandoned';
export type RejectionReason = 'low_income' | 'age' | 'incomplete_docs' | 'other';
export type AbandonmentStep = 'income' | 'id_number' | 'email' | 'name' | 'other';

export interface ProductInterestEvent {
  productName: string;
  outcome?: ProductOutcome;
  rejection_reason?: RejectionReason;
  abandonment_step?: AbandonmentStep;
}

export interface AppointmentEvent {
  productName: string;
  scheduled_at: string;
  status?: 'pending_confirmation' | 'confirmed' | 'rejected_by_client';
  summary?: string;
}

export interface AgentEvents {
  userData?: UserDataUpdate;
  productInterest?: ProductInterestEvent;
  appointment?: AppointmentEvent;
  closeConversation?: 'completed' | 'abandoned';
}

export interface DbSessionContext {
  dbUserId: string;
  dbConversationId: string;
  channel: string;
}

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  min_income: number | null;
  min_age: number | null;
  max_age: number | null;
}

export interface AdvisorRow {
  id: string;
  name: string;
  active: boolean;
}
