import { AgentEvents } from '../types/persistence.types';

const EVENTS_BLOCK_REGEX = /<events>\s*([\s\S]*?)\s*<\/events>/i;

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
    const events = JSON.parse(jsonText) as AgentEvents;
    return { cleanText, events };
  } catch {
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
