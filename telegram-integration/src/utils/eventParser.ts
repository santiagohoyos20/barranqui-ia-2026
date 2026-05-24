import { AgentEvents } from '../types/persistence.types';

const EVENTS_BLOCK_REGEX = /<events>\s*([\s\S]*?)\s*<\/events>/i;
const JSON_FENCE_REGEX = /```(?:json)?\s*([\s\S]*?)\s*```/i;

export function parseAgentEvents(rawResponse: string): {
  cleanText: string;
  events: AgentEvents | null;
} {
  let events: AgentEvents | null = null;
  let cleanText = rawResponse.trim();

  const eventsMatch = rawResponse.match(EVENTS_BLOCK_REGEX);
  if (eventsMatch) {
    cleanText = rawResponse.replace(EVENTS_BLOCK_REGEX, '').trim();
    events = tryParseEventsJson(eventsMatch[1]);
  } else {
    const fenceMatch = rawResponse.match(JSON_FENCE_REGEX);
    if (fenceMatch) {
      const parsed = tryParseEventsJson(fenceMatch[1]);
      if (parsed && looksLikeAgentEvents(parsed)) {
        events = parsed;
        cleanText = rawResponse.replace(JSON_FENCE_REGEX, '').trim();
      }
    }
  }

  return { cleanText, events };
}

function tryParseEventsJson(jsonText: string): AgentEvents | null {
  try {
    return JSON.parse(jsonText.trim()) as AgentEvents;
  } catch {
    return null;
  }
}

function looksLikeAgentEvents(value: AgentEvents): boolean {
  return Boolean(
    value.userData || value.productInterest || value.appointment || value.closeConversation
  );
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
