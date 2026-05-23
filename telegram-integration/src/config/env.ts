import dotenv from 'dotenv';

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
    systemPrompt: process.env.AGENT_SYSTEM_PROMPT || 'Eres un asistente de Serfinanza, una entidad financiera colombiana. Responde de forma clara, amigable y profesional en español.',
  },

  // Conversation
  conversation: {
    idleTimeout: 24 * 60 * 60 * 1000, // 24 horas
    cleanupInterval: 60 * 60 * 1000, // Cada hora
    maxMessages: 100, // Máximo de mensajes por sesión
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
