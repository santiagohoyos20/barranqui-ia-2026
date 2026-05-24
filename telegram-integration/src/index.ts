import app from './app';
import logger from './utils/logger';
import { config } from './config/env';
import telegramClient from './services/telegram/client.service';
import persistenceService from './services/supabase/persistence.service';

const PORT = config.port;

const server = app.listen(PORT, async () => {
  logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
  logger.info(`📍 Ambiente: ${config.nodeEnv}`);
  logger.info(`📝 Nivel de log: ${config.logLevel}`);
  logger.info(`🤖 Modelo IA: ${config.agent.model}`);

  await persistenceService.initialize();

  if (config.telegram.webhookUrl && config.telegram.botToken) {
    const webhookUrl = `${config.telegram.webhookUrl.replace(/\/$/, '')}${
      config.telegram.webhookPath
    }`;
    try {
      await telegramClient.setWebhook(
        webhookUrl,
        config.telegram.webhookSecretToken || undefined
      );
    } catch (error) {
      logger.error('No se pudo registrar el webhook de Telegram', {
        error: error instanceof Error ? error.message : error,
      });
    }
  } else {
    logger.info(
      'ℹ️  TELEGRAM_WEBHOOK_URL no configurada: el webhook debe registrarse manualmente con setWebhook'
    );
  }

  logger.info('✅ Sistema listo para recibir mensajes de Telegram');
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`El puerto ${PORT} ya está en uso`);
  } else {
    logger.error('Error del servidor', { error: error.message });
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('Promesa rechazada sin manejo', {
    reason: reason instanceof Error ? reason.message : reason,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada', { error: error.message });
  process.exit(1);
});

export default server;
