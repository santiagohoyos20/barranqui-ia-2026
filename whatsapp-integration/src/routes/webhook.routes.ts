import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import messageOrchestrator from '../services/orchestrator/message.orchestrator';
import whatsappWebhookService from '../services/whatsapp/webhook.service';
import whatsappClient from '../services/whatsapp/client.service';
import agentClient from '../services/agent/client.service';
import conversationManager from '../services/conversation/manager.service';
import {
  validateWebhookToken,
  validateJsonBody,
  validateWebhookType,
} from '../middleware/validation.middleware';
import { WhatsAppMessageBody } from '../types/whatsapp.types';

const router = Router();

/**
 * GET /webhook/messages
 * Validación de webhook de Meta
 */
router.get('/messages', validateWebhookToken, (req: Request, res: Response) => {
  const challenge = req.query.hub_challenge as string;

  if (!challenge) {
    logger.warn('Challenge no proporcionado en validación de webhook');
    res.status(400).json({ error: 'Challenge no proporcionado' });
    return;
  }

  logger.info('Webhook validado correctamente');
  res.status(200).send(challenge);
});

/**
 * POST /webhook/messages
 * Recibe mensajes de WhatsApp
 */
router.post(
  '/messages',
  validateJsonBody,
  validateWebhookType,
  async (req: Request, res: Response) => {
    try {
      const body = req.body as WhatsAppMessageBody;

      logger.info('Webhook recibido', {
        entries: body.entry?.length || 0,
      });

      // Responder inmediatamente a WhatsApp
      res.status(200).json({ received: true });

      // Procesar mensajes de forma asincrónica
      const messages = whatsappWebhookService.extractMessages(body);
      const statuses = whatsappWebhookService.extractStatuses(body);

      // Procesar cada mensaje
      for (const message of messages) {
        if (whatsappWebhookService.isValidMessage(message)) {
          try {
            await messageOrchestrator.processMessage(message);
          } catch (error) {
            logger.error('Error procesando mensaje individual', {
              messageId: message.id,
              error: error instanceof Error ? error.message : error,
            });
          }
        }
      }

      // Log de cambios de estado (opcional)
      if (statuses.length > 0) {
        logger.debug('Cambios de estado recibidos', { count: statuses.length });
      }
    } catch (error) {
      logger.error('Error procesando webhook', {
        error: error instanceof Error ? error.message : error,
      });
      // Aún así responder 200 para que WhatsApp no reintente
      res.status(200).json({ error: 'Procesado con errores' });
    }
  }
);

/**
 * GET /health
 * Health check del servidor
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const whatsappOk = await whatsappClient.healthCheck();
    const agentOk = await agentClient.healthCheck();
    const stats = conversationManager.getStats();

    res.status(200).json({
      status: 'ok',
      whatsapp: whatsappOk ? 'connected' : 'disconnected',
      agent: agentOk ? 'connected' : 'disconnected',
      conversationStats: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error en health check', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /stats
 * Estadísticas del sistema
 */
router.get('/stats', (req: Request, res: Response) => {
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
 * GET /conversation/:userId
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
      phone: context.phone,
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
