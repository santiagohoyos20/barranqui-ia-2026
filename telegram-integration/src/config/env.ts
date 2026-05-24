import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    // Token compartido con Telegram al registrar el webhook (cabecera
    // X-Telegram-Bot-Api-Secret-Token). Cualquier valor de 1 a 256
    // caracteres alfanuméricos: A-Z, a-z, 0-9, '_' y '-'.
    webhookSecretToken: process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN || '',
    // URL pública opcional para registrar el webhook automáticamente al
    // arrancar (ej: https://midominio.com).
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
    // Path interno del webhook (debe coincidir con la ruta expuesta en Express)
    webhookPath: process.env.TELEGRAM_WEBHOOK_PATH || '/webhook/telegram',
    apiBaseUrl: 'https://api.telegram.org',
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
      'Estilo conversacional:\n' +
      '- Haz SOLO UNA pregunta a la vez. Nunca hagas varias preguntas en el mismo mensaje.\n' +
      '- Espera la respuesta del usuario antes de continuar con la siguiente pregunta.\n' +
      '- Mantén un flujo natural de conversación, como si fuera un chat.\n\n' +
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
  const required = ['TELEGRAM_BOT_TOKEN'];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  Variables de entorno faltantes: ${missing.join(', ')}`);
    console.warn('Por favor, configura estas variables en tu archivo .env');
  }

  if (!process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN) {
    console.warn(
      '⚠️  TELEGRAM_WEBHOOK_SECRET_TOKEN no configurado. Es altamente recomendado para validar webhooks.'
    );
  }
}
