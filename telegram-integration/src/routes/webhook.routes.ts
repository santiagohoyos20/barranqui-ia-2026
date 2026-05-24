import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import messageOrchestrator from '../services/orchestrator/message.orchestrator';
import telegramWebhookService from '../services/telegram/webhook.service';
import telegramClient from '../services/telegram/client.service';
import agentClient from '../services/agent/client.service';
import conversationManager from '../services/conversation/manager.service';
import {
  validateTelegramSecretToken,
  validateJsonBody,
  validateTelegramUpdate,
} from '../middleware/validation.middleware';
import { TelegramUpdate } from '../types/telegram.types';

const router = Router();

/**
 * POST /webhook/telegram
 * Recibe Updates desde Telegram (los mensajes de los usuarios)
 */
router.post(
  '/telegram',
  validateTelegramSecretToken,
  validateJsonBody,
  validateTelegramUpdate,
  async (req: Request, res: Response) => {
    try {
      const update = req.body as TelegramUpdate;

      logger.info('Webhook recibido de Telegram', {
        updateId: update.update_id,
      });

      // Responder inmediatamente a Telegram (debe ser <= 60s)
      res.status(200).json({ ok: true });

      // Procesar mensaje(s) de forma asincrónica
      const messages = telegramWebhookService.extractMessages(update);

      for (const message of messages) {
        if (telegramWebhookService.isValidMessage(message)) {
          try {
            await messageOrchestrator.processMessage(message);
          } catch (error) {
            logger.error('Error procesando mensaje individual', {
              messageId: message.message_id,
              error: error instanceof Error ? error.message : error,
            });
          }
        } else {
          logger.debug('Mensaje no válido o no soportado, ignorado', {
            messageId: message.message_id,
          });
        }
      }
    } catch (error) {
      logger.error('Error procesando webhook', {
        error: error instanceof Error ? error.message : error,
      });
      // Responder 200 para que Telegram no reintente indefinidamente
      if (!res.headersSent) {
        res.status(200).json({ ok: true, error: 'Procesado con errores' });
      }
    }
  }
);

/**
 * GET /webhook/health
 * Health check del servidor
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const telegramOk = await telegramClient.healthCheck();
    const agentOk = await agentClient.healthCheck();
    const stats = conversationManager.getStats();
    const persistenceService = (await import('../services/supabase/persistence.service')).default;

    res.status(200).json({
      status: 'ok',
      telegram: telegramOk ? 'connected' : 'disconnected',
      agent: agentOk ? 'connected' : 'disconnected',
      persistence: persistenceService.isEnabled() ? 'enabled' : 'disabled',
      persistenceReady: persistenceService.isReady(),
      conversationStats: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error en health check', {
      error: error instanceof Error ? error.message : error,
    });

    // 200 para que el healthcheck de Docker/Railway no mate el contenedor
    res.status(200).json({
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /webhook/stats
 * Estadísticas del sistema
 */
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = conversationManager.getStats();

    res.status(200).json({
      conversationStats: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /webhook/conversation/:userId
 * Obtiene información de una sesión de usuario
 */
router.get('/conversation/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const context = conversationManager.getConversationContext(userId);

    if (!context) {
      res.status(404).json({ error: 'Sesión no encontrada' });
      return;
    }

    res.status(200).json({
      userId: context.userId,
      chatId: context.chatId,
      messageCount: context.history.length,
      messages: context.history,
    });
  } catch (error) {
    logger.error('Error obteniendo contexto de conversación', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
