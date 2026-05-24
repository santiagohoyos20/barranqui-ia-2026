import logger from '../../utils/logger';
import conversationManager from '../conversation/manager.service';
import agentClient from '../agent/client.service';
import telegramClient from '../telegram/client.service';
import telegramWebhookService from '../telegram/webhook.service';
import knowledgeLoader from '../knowledge/loader.service';
import persistenceService from '../supabase/persistence.service';
import { parseAgentEvents } from '../../utils/eventParser';
import {
  hasPersistableEvents,
  mergeInferredEvents,
} from '../../utils/conversationExtractor';
import { TelegramMessage } from '../../types/telegram.types';
import { ConversationMessage } from '../../types/conversation.types';
import { DbSessionContext } from '../../types/persistence.types';

class MessageOrchestrator {
  async processMessage(message: TelegramMessage): Promise<void> {
    if (!message.from || !message.chat) {
      logger.warn('[TG] Mensaje sin from/chat, ignorado', { messageId: message.message_id });
      return;
    }

    const userId = String(message.from.id);
    const chatId = message.chat.id;
    const username = message.from.username;
    const channel = 'telegram' as const;
    const phone = `tg:${userId}`;

    try {
      logger.info('[TG] Procesando mensaje', {
        userId,
        chatId,
        messageId: message.message_id,
        persistenceEnabled: persistenceService.isEnabled(),
        persistenceReady: persistenceService.isReady(),
      });

      const session = conversationManager.getOrCreateSession(userId, chatId, username);

      let dbCtx = this.getDbContext(session.metadata);

      if (!dbCtx) {
        if (!persistenceService.isEnabled()) {
          logger.warn('[DB] Persistencia NO habilitada — mensajes no se guardarán en Supabase');
        } else {
          const displayName = this.buildDisplayName(message);
          dbCtx = await persistenceService.startChannelSession(phone, channel, displayName);
          if (dbCtx) {
            session.metadata = { ...session.metadata, ...dbCtx };
            logger.info('[DB] Contexto DB asignado a sesión', dbCtx);
          } else {
            logger.error('[DB] No se pudo crear contexto DB — datos NO se guardarán');
          }
        }
      } else {
        logger.info('[DB] Reutilizando contexto DB de sesión', dbCtx);
      }

      void telegramClient.sendChatAction(chatId, 'typing');

      const messageContent = telegramWebhookService.getMessageContent(message);
      logger.info('[TG] Contenido del mensaje', {
        userId,
        length: messageContent.length,
        preview: messageContent.slice(0, 120),
      });

      conversationManager.addMessage(userId, {
        role: 'user',
        content: messageContent,
        timestamp: Date.now(),
        metadata: this.extractMessageMetadata(message),
      });

      if (dbCtx) {
        const saved = await persistenceService.insertMessage(dbCtx.dbConversationId, 'user', messageContent);
        if (!saved) logger.warn('[DB] Falló guardado de mensaje de usuario');
      }

      const conversationHistory = conversationManager.getConversationHistory(userId);
      const knowledgeContext = knowledgeLoader.getContextForMessage(messageContent);
      const productCatalog = knowledgeLoader.getProductCatalogHint(
        persistenceService.getProductNames()
      );

      const agentResponse = await agentClient.sendMessage({
        userId,
        currentMessage: messageContent,
        conversationHistory,
        knowledgeContext: [knowledgeContext, productCatalog].filter(Boolean).join('\n\n'),
        metadata: {
          chatId,
          username,
          name: this.buildDisplayName(message),
          channel,
          persistEvents: true,
        },
      });

      const { cleanText, events: agentEvents } = parseAgentEvents(agentResponse.response);
      const mergedEvents = mergeInferredEvents(
        agentEvents,
        messageContent,
        persistenceService.getProductNames()
      );

      logger.info('[TG] Respuesta del agente procesada', {
        userId,
        responseLength: cleanText.length,
        hadAgentEvents: Boolean(agentEvents),
        hadMergedEvents: hasPersistableEvents(mergedEvents),
        mergedEvents: hasPersistableEvents(mergedEvents) ? mergedEvents : undefined,
      });

      conversationManager.addMessage(userId, {
        role: 'agent',
        content: cleanText,
        timestamp: Date.now(),
        metadata: { ...((agentResponse.metadata || {}) as Record<string, unknown>) },
      });

      if (dbCtx) {
        const saved = await persistenceService.insertMessage(dbCtx.dbConversationId, 'assistant', cleanText);
        if (!saved) logger.warn('[DB] Falló guardado de mensaje del asistente');

        if (hasPersistableEvents(mergedEvents)) {
          await persistenceService.processEvents(dbCtx, mergedEvents);
        } else {
          logger.info('[DB] Sin eventos persistibles en este turno', { userId });
        }
      }

      await telegramClient.sendTextMessage(chatId, cleanText);

      logger.info('[TG] Mensaje procesado exitosamente', {
        userId,
        messageId: message.message_id,
        persisted: Boolean(dbCtx),
      });
    } catch (error) {
      logger.error('[TG] Error procesando mensaje', {
        userId,
        messageId: message.message_id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      await this.sendErrorMessage(chatId);
    }
  }

  async processWebChat(
    userId: string,
    messageContent: string,
    displayName?: string
  ): Promise<string> {
    logger.info('[WEB] Chat interno (sin persistencia DB)', { userId });

    conversationManager.getOrCreateSession(userId, undefined, displayName);
    conversationManager.addMessage(userId, {
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    });

    const fullHistory = conversationManager.getConversationHistory(userId);
    const conversationHistory = fullHistory.slice(0, -1);
    const knowledgeContext = knowledgeLoader.getContextForMessage(messageContent);

    const agentResponse = await agentClient.sendMessage({
      userId,
      currentMessage: messageContent,
      conversationHistory,
      knowledgeContext,
      metadata: { name: displayName, channel: 'web', persistEvents: false },
    });

    const { cleanText } = parseAgentEvents(agentResponse.response);

    conversationManager.addMessage(userId, {
      role: 'agent',
      content: cleanText,
      timestamp: Date.now(),
    });

    return cleanText;
  }

  private getDbContext(metadata?: Record<string, unknown>): DbSessionContext | null {
    if (!metadata?.dbUserId || !metadata?.dbConversationId) return null;
    return {
      dbUserId: metadata.dbUserId as string,
      dbConversationId: metadata.dbConversationId as string,
      channel: (metadata.channel as string) ?? 'telegram',
    };
  }

  private buildDisplayName(message: TelegramMessage): string | undefined {
    if (!message.from) return undefined;
    const first = message.from.first_name || '';
    const last = message.from.last_name || '';
    const full = `${first} ${last}`.trim();
    return full || message.from.username;
  }

  private extractMessageMetadata(
    message: TelegramMessage
  ): ConversationMessage['metadata'] {
    const type = telegramWebhookService.detectMessageType(message);
    const metadata: NonNullable<ConversationMessage['metadata']> = {
      type: type === 'unknown' ? undefined : type,
      telegramMessageId: message.message_id,
    };

    if (type === 'photo' && message.photo && message.photo.length > 0) {
      metadata.fileId = message.photo[message.photo.length - 1].file_id;
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

  private async sendErrorMessage(chatId: number): Promise<void> {
    try {
      await telegramClient.sendTextMessage(
        chatId,
        'Disculpa, tenemos un problema procesando tu solicitud. Por favor intenta de nuevo.'
      );
    } catch (error) {
      logger.error('[TG] Error enviando mensaje de error', {
        chatId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  getStats() {
    return {
      conversationManager: conversationManager.getStats(),
      persistenceEnabled: persistenceService.isEnabled(),
      persistenceReady: persistenceService.isReady(),
    };
  }
}

export default new MessageOrchestrator();
