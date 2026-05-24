import app from './app';
import logger from './utils/logger';
import { config } from './config/env';
import telegramClient from './services/telegram/client.service';
import persistenceService from './services/supabase/persistence.service';

const PORT = config.port;

async function startServer(): Promise<void> {
  logger.info('[BOOT] Iniciando servidor Serfinanza Telegram...');
  logger.info('[BOOT] Ambiente:', { nodeEnv: config.nodeEnv, logLevel: config.logLevel, model: config.agent.model });

  try {
    await persistenceService.initialize();
  } catch (error) {
    logger.error('[BOOT] Supabase no pudo inicializarse — el bot seguirá sin persistencia', {
      error: error instanceof Error ? error.message : error,
    });
  }

  const server = app.listen(PORT, async () => {
    logger.info(`[BOOT] Servidor escuchando en puerto ${PORT}`);

    if (config.telegram.webhookUrl && config.telegram.botToken) {
      const webhookUrl = `${config.telegram.webhookUrl.replace(/\/$/, '')}${config.telegram.webhookPath}`;
      try {
        await telegramClient.setWebhook(webhookUrl, config.telegram.webhookSecretToken || undefined);
        logger.info('[BOOT] Webhook de Telegram registrado', { webhookUrl });
      } catch (error) {
        logger.error('[BOOT] No se pudo registrar webhook de Telegram', {
          error: error instanceof Error ? error.message : error,
        });
      }
    } else {
      logger.warn('[BOOT] TELEGRAM_WEBHOOK_URL no configurada');
    }

    logger.info('[BOOT] Sistema listo', {
      persistenceEnabled: persistenceService.isEnabled(),
      persistenceReady: persistenceService.isReady(),
    });
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`[BOOT] Puerto ${PORT} ya está en uso — detén la instancia anterior`);
    } else {
      logger.error('[BOOT] Error del servidor', { error: error.message });
    }
    process.exit(1);
  });
}

startServer().catch((error) => {
  logger.error('[BOOT] Fallo al iniciar', { error: error instanceof Error ? error.message : error });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('[BOOT] Promesa rechazada sin manejo', {
    reason: reason instanceof Error ? reason.message : reason,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('[BOOT] Excepción no capturada', { error: error.message });
  process.exit(1);
});

export default startServer;
