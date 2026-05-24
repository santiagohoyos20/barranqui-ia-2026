import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config/env';
import { ExtractedIntelligence, ProductInterest, IntentType } from '../../types/intelligence.types';

const EXTRACTION_PROMPT = `Eres un extractor de datos de conversaciones de Banco Serfinanza (Colombia).
Analiza el último intercambio usuario-agente y extrae información en JSON.

Extrae SOLO lo que esté explícitamente mencionado. Si algo no está claro, usa null.

Productos válidos (usa el nombre exacto):
"CDT", "Cuenta de Ahorros", "Crédito Personal", "Crédito Empresarial",
"Tarjeta de Crédito", "Leasing", "Seguro de Vida", "Otro"

Tipos de intención: informacion, cotizacion, solicitud_cita, queja, otro

Razón de rechazo (solo si el agente indica que el usuario no califica):
"low_income", "age", "incomplete_docs", "other"

Paso de abandono (solo si el usuario dejó de responder en un punto):
"income", "id_number", "email", "name", "other"

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "userData": { "name": null, "phone": null, "email": null },
  "productInterests": [],
  "intentType": "otro",
  "rejectionReason": null,
  "abandonmentStep": null,
  "appointmentRequest": { "detected": false, "preferredTime": null, "notes": null },
  "summary": "resumen en una oración"
}`;

class IntelligenceExtractor {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: config.agent.apiKey });
  }

  async extract(
    userMessage: string,
    agentResponse: string,
    userId: string
  ): Promise<ExtractedIntelligence | null> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `${EXTRACTION_PROMPT}\n\nMensaje del usuario: "${userMessage}"\nRespuesta del agente: "${agentResponse}"`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        userData: {
          name:  parsed.userData?.name  || undefined,
          phone: parsed.userData?.phone || undefined,
          email: parsed.userData?.email || undefined,
        },
        productInterests:  (parsed.productInterests || []) as ProductInterest[],
        intentType:        (parsed.intentType || 'otro') as IntentType,
        rejectionReason:   parsed.rejectionReason || undefined,
        abandonmentStep:   parsed.abandonmentStep || undefined,
        appointmentRequest: {
          detected:      Boolean(parsed.appointmentRequest?.detected),
          preferredTime: parsed.appointmentRequest?.preferredTime || undefined,
          notes:         parsed.appointmentRequest?.notes         || undefined,
        },
        summary: parsed.summary || '',
      };
    } catch (error) {
      console.error(`[Extractor] Error extrayendo inteligencia para usuario ${userId}:`, error);
      return null;
    }
  }
}

export default new IntelligenceExtractor();
