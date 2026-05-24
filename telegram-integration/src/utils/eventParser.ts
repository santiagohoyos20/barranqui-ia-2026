import logger from './logger';
import {
  AgentEvents,
  AppointmentEvent,
  ProductInterestEvent,
  UserDataUpdate,
} from '../types/persistence.types';

const EVENTS_BLOCK_REGEX = /<events>\s*([\s\S]*?)\s*<\/events>/i;

// Listas alineadas con los CHECK constraints en supabase/schema.sql.
// Si la BD cambia, actualizar aquí también.
const ALLOWED_USER_STATUS = ['prospect', 'qualified', 'rejected'] as const;
const ALLOWED_PRODUCT_OUTCOME = ['interested', 'qualified', 'rejected', 'abandoned'] as const;
const ALLOWED_REJECTION_REASON = ['low_income', 'age', 'incomplete_docs', 'other'] as const;
const ALLOWED_ABANDONMENT_STEP = ['income', 'id_number', 'email', 'name', 'other'] as const;
const ALLOWED_APPOINTMENT_STATUS = ['pending_confirmation', 'confirmed', 'rejected_by_client'] as const;
const ALLOWED_CLOSE_CONVERSATION = ['completed', 'abandoned'] as const;

function pickEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string
): T | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  logger.warn(`Valor inválido para ${field}, descartado`, {
    value,
    allowed,
  });
  return undefined;
}

function sanitizeAgentEvents(raw: unknown): AgentEvents | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const out: AgentEvents = {};

  if (r.userData && typeof r.userData === 'object') {
    const ud = r.userData as Record<string, unknown>;
    const cleaned: UserDataUpdate = {};
    if (typeof ud.name === 'string') cleaned.name = ud.name;
    if (typeof ud.email === 'string') cleaned.email = ud.email;
    if (typeof ud.id_number === 'string') cleaned.id_number = ud.id_number;
    if (typeof ud.monthly_income === 'number') cleaned.monthly_income = ud.monthly_income;
    const status = pickEnum(ud.status, ALLOWED_USER_STATUS, 'userData.status');
    if (status) cleaned.status = status;
    if (Object.keys(cleaned).length > 0) out.userData = cleaned;
  }

  if (r.productInterest && typeof r.productInterest === 'object') {
    const pi = r.productInterest as Record<string, unknown>;
    if (typeof pi.productName === 'string' && pi.productName.trim()) {
      const cleaned: ProductInterestEvent = { productName: pi.productName };
      const outcome = pickEnum(pi.outcome, ALLOWED_PRODUCT_OUTCOME, 'productInterest.outcome');
      if (outcome) cleaned.outcome = outcome;
      const rejection = pickEnum(
        pi.rejection_reason,
        ALLOWED_REJECTION_REASON,
        'productInterest.rejection_reason'
      );
      if (rejection) cleaned.rejection_reason = rejection;
      const abandonment = pickEnum(
        pi.abandonment_step,
        ALLOWED_ABANDONMENT_STEP,
        'productInterest.abandonment_step'
      );
      if (abandonment) cleaned.abandonment_step = abandonment;
      out.productInterest = cleaned;
    }
  }

  if (r.appointment && typeof r.appointment === 'object') {
    const ap = r.appointment as Record<string, unknown>;
    if (
      typeof ap.productName === 'string' && ap.productName.trim() &&
      typeof ap.scheduled_at === 'string' && ap.scheduled_at.trim()
    ) {
      const cleaned: AppointmentEvent = {
        productName: ap.productName,
        scheduled_at: ap.scheduled_at,
      };
      const status = pickEnum(ap.status, ALLOWED_APPOINTMENT_STATUS, 'appointment.status');
      if (status) cleaned.status = status;
      if (typeof ap.summary === 'string') cleaned.summary = ap.summary;
      out.appointment = cleaned;
    }
  }

  const close = pickEnum(r.closeConversation, ALLOWED_CLOSE_CONVERSATION, 'closeConversation');
  if (close) out.closeConversation = close;

  return Object.keys(out).length > 0 ? out : null;
}

export function parseAgentEvents(rawResponse: string): {
  cleanText: string;
  events: AgentEvents | null;
} {
  const match = rawResponse.match(EVENTS_BLOCK_REGEX);

  if (!match) {
    return { cleanText: rawResponse.trim(), events: null };
  }

  const cleanText = rawResponse.replace(EVENTS_BLOCK_REGEX, '').trim();
  const jsonText = match[1].trim();

  try {
    const raw = JSON.parse(jsonText);
    const events = sanitizeAgentEvents(raw);
    return { cleanText, events };
  } catch (err) {
    logger.warn('Bloque <events> con JSON inválido, ignorado', {
      error: err instanceof Error ? err.message : err,
    });
    return { cleanText, events: null };
  }
}

export function buildEventsPromptSection(): string {
  return `
EVENTOS DE NEGOCIO (obligatorio en canal WhatsApp/Telegram):
Al final de CADA respuesta incluye un bloque oculto con eventos de negocio. El usuario NO debe ver este bloque en el chat; solo se usa internamente.

Formato exacto:
<events>
{
  "userData": { "name": "...", "email": "...", "monthly_income": 2500000, "id_number": "...", "status": "prospect|qualified|rejected" },
  "productInterest": { "productName": "Crédito de vivienda", "outcome": "interested|qualified|rejected|abandoned", "rejection_reason": "low_income|age|incomplete_docs|other", "abandonment_step": "income|id_number|email|name|other" },
  "appointment": { "productName": "Crédito de vivienda", "scheduled_at": "2026-05-25T10:00:00-05:00", "status": "pending_confirmation|confirmed", "summary": "..." },
  "closeConversation": "completed|abandoned"
}
</events>

Reglas:
- Solo incluye campos que cambiaron en este turno.
- productName debe coincidir con un producto Serfinanza (ej: "Crédito de vivienda", "CDT", "Crédito libre inversión").
- Cuando el usuario pregunte por un producto, emite productInterest con outcome "interested".
- Tras validar ingresos/edad, emite outcome "qualified" o "rejected" con rejection_reason.
- Si el usuario deja de responder tras pedir un dato, emite outcome "abandoned" con abandonment_step.
- Si agenda cita, emite appointment con scheduled_at ISO y status "confirmed" cuando el usuario confirme.
- Si la conversación termina, emite closeConversation.
- En consultas informativas sin producto específico, omite productInterest.
- NUNCA incluyas el bloque <events> en el texto visible para el usuario; va al final, separado.
`.trim();
}
