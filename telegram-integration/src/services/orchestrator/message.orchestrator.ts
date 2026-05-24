import logger from '../../utils/logger';
import conversationManager from '../conversation/manager.service';
import agentClient from '../agent/client.service';
import telegramClient from '../telegram/client.service';
import telegramWebhookService from '../telegram/webhook.service';
import { TelegramMessage } from '../../types/telegram.types';
import { ConversationMessage } from '../../types/conversation.types';

class MessageOrchestrator {
  /**
   * Procesa un mensaje recibido de Telegram
   * Flujo: Telegram → Conversation Manager → Agent → Telegram
   */
  async processMessage(message: TelegramMessage): Promise<void> {
    if (!message.from || !message.chat) {
      logger.warn('Mensaje sin from/chat, ignorado', {
        messageId: message.message_id,
      });
      return;
    }

    const userId = String(message.from.id);
    const chatId = message.chat.id;
    const username = message.from.username;

    try {
      logger.info('Iniciando procesamiento de mensaje', {
        userId,
        chatId,
        messageId: message.message_id,
        type: telegramWebhookService.detectMessageType(message),
      });

      // 1. Obtener o crear sesión del usuario
      const session = conversationManager.getOrCreateSession(
        userId,
        chatId,
        username
      );
      logger.debug('Sesión obtenida/creada', {
        userId,
        messagesCount: session.messages.length,
      });

      // 2. Mostrar indicador "escribiendo..." al usuario
      void telegramClient.sendChatAction(chatId, 'typing');

      // 3. Extraer contenido del mensaje
      const messageContent = telegramWebhookService.getMessageContent(message);
      logger.debug('Contenido extraído', {
        userId,
        contentLength: messageContent.length,
      });

      // 4. Agregar mensaje del usuario al contexto
      const userMessage: ConversationMessage = {
        role: 'user',
        content: messageContent,
        timestamp: Date.now(),
        metadata: this.extractMessageMetadata(message),
      };
      conversationManager.addMessage(userId, userMessage);

      // 5. Obtener historial de conversación
      const conversationHistory = conversationManager.getConversationHistory(userId);
      logger.debug('Historial de conversación obtenido', {
        userId,
        historyLength: conversationHistory.length,
      });

      // 6. Enviar al agente IA
      logger.info('Enviando mensaje al agente IA', { userId });

      const agentRequest = {
        userId,
        currentMessage: messageContent,
        conversationHistory,
        metadata: {
          chatId,
          username,
          name: this.buildDisplayName(message),
        },
      };

      const agentResponse = await agentClient.sendMessage(agentRequest);
      logger.info('Respuesta recibida del agente', {
        userId,
        confidence: agentResponse.confidence,
      });

      // 7. Agregar respuesta del agente al contexto
      const agentMessage: ConversationMessage = {
        role: 'agent',
        content: agentResponse.response,
        timestamp: Date.now(),
        metadata: {
          ...((agentResponse.metadata || {}) as Record<string, any>),
        },
      };
      conversationManager.addMessage(userId, agentMessage);

      // 8. Enviar respuesta a Telegram
      logger.info('Enviando respuesta a Telegram', { userId, chatId });
      await telegramClient.sendTextMessage(chatId, agentResponse.response);

      logger.info('Mensaje procesado exitosamente', {
        userId,
        messageId: message.message_id,
      });
    } catch (error) {
      logger.error('Error procesando mensaje', {
        userId,
        messageId: message.message_id,
        error: error instanceof Error ? error.message : error,
      });

      await this.sendErrorMessage(chatId);
    }
  }

  /**
   * Construye el nombre del usuario para incluirlo en metadata
   */
  private buildDisplayName(message: TelegramMessage): string | undefined {
    if (!message.from) return undefined;
    const first = message.from.first_name || '';
    const last = message.from.last_name || '';
    const full = `${first} ${last}`.trim();
    return full || message.from.username;
  }

  /**
   * Extrae metadatos del mensaje
   */
  private extractMessageMetadata(
    message: TelegramMessage
  ): ConversationMessage['metadata'] {
    const type = telegramWebhookService.detectMessageType(message);
    const metadata: NonNullable<ConversationMessage['metadata']> = {
      type: type === 'unknown' ? undefined : type,
      telegramMessageId: message.message_id,
    };

    if (type === 'photo' && message.photo && message.photo.length > 0) {
      const largest = message.photo[message.photo.length - 1];
      metadata.fileId = largest.file_id;
    }

    if (type === 'document' && message.document) {
      metadata.fileId = message.document.file_id;
      metadata.filename = message.document.file_name;
      metadata.mimeType = message.document.mime_type;
    }

    if (type === 'audio' && message.audio) {
      metadata.fileId = message.audio.file_id;
      metadata.mimeType = message.audio.mime_type;
    }

    if (type === 'voice' && message.voice) {
      metadata.fileId = message.voice.file_id;
      metadata.mimeType = message.voice.mime_type;
    }

    if (type === 'video' && message.video) {
      metadata.fileId = message.video.file_id;
      metadata.mimeType = message.video.mime_type;
    }

    return metadata;
  }

  /**
   * Envía mensaje de error al usuario
   */
  private async sendErrorMessage(chatId: number): Promise<void> {
    try {
      const errorMessage =
        'Disculpa, tenemos un problema procesando tu solicitud. Por favor intenta de nuevo.';
      await telegramClient.sendTextMessage(chatId, errorMessage);
    } catch (error) {
      logger.error('Error enviando mensaje de error a usuario', {
        chatId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Obtiene estadísticas del orquestador
   */
  getStats() {
    return {
      conversationManager: conversationManager.getStats(),
    };
  }
}

export default new MessageOrchestrator();
