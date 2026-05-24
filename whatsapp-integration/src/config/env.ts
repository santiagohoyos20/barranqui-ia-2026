import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // WhatsApp
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    webhookToken: process.env.WHATSAPP_WEBHOOK_TOKEN || '',
    apiVersion: 'v18.0',
    baseUrl: 'https://graph.instagram.com',
  },

  // Agent (Anthropic Claude)
  agent: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    systemPrompt: process.env.AGENT_SYSTEM_PROMPT ||
      'Eres un asesor virtual de Banco Serfinanza, una entidad financiera colombiana. ' +
      'Tu rol es orientar a los clientes sobre los productos y servicios del banco de forma clara, precisa y cercana.\n\n' +
      'Cuando se te proporcione información de productos:\n' +
      '- Responde basándote en esa información y sé específico con montos, plazos y requisitos.\n' +
      '- Si el usuario pregunta por tasas o condiciones exactas no incluidas, indícale que puede consultarlas en la sucursal o en bancoserfinanza.com.\n' +
      '- Si la consulta no corresponde a ningún producto disponible, oriéntalo amablemente.\n' +
      '- Usa un tono profesional pero cercano, en español colombiano.',
  },

  // Conversation
  conversation: {
    idleTimeout: 24 * 60 * 60 * 1000, // 24 horas
    cleanupInterval: 60 * 60 * 1000, // Cada hora
    maxMessages: 100, // Máximo de mensajes por sesión
  },

  // Knowledge base — __dirname es src/config/, subimos 3 niveles hasta project/
  knowledge: {
    basePath: process.env.KNOWLEDGE_BASE_PATH || path.resolve(__dirname, '../../../scrapper/md'),
  },
};

// Validación de configuración crítica
export function validateConfig(): void {
  const required = [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_WEBHOOK_TOKEN',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  Variables de entorno faltantes: ${missing.join(', ')}`);
    console.warn('Por favor, configura estas variables en tu archivo .env');
  }
}
