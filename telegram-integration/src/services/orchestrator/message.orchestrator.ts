import logger from '../../utils/logger';
import conversationManager from '../conversation/manager.service';
import agentClient from '../agent/client.service';
import telegramClient from '../telegram/client.service';
import telegramWebhookService from '../telegram/webhook.service';
import intelligenceExtractor from '../intelligence/extractor.service';
import leadRepository from '../supabase/lead.repository';
import knowledgeLoader from '../knowledge/loader.service';
import persistenceService from '../supabase/persistence.service';
import { parseAgentEvents } from '../../utils/eventParser';
import { TelegramMessage } from '../../types/telegram.types';
import { ConversationMessage } from '../../types/conversation.types';
import { DbSessionContext } from '../../types/persistence.types';

class MessageOrchestrator {
  constructor() {
    conversationManager.onSessionClose(async (session) => {
      const conversationId = session.metadata?.supabaseConversationId as string | undefined;
      if (conversationId) {
        await leadRepository.closeConversation(conversationId);
      } else {
        console.log(`[Sesión] Sesión de usuario ${session.userId} cerrada sin conversación en Supabase`);
      }
    });
  }

  /**
   * Procesa un mensaje recibido de Telegram (canal externo → persiste en Supabase)
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
    const channel = 'telegram' as const;
    const phone = `tg:${userId}`;

    try {
      logger.info('Iniciando procesamiento de mensaje', {
        userId,
        chatId,
        messageId: message.message_id,
        type: telegramWebhookService.detectMessageType(message),
      });

      const session = conversationManager.getOrCreateSession(
        userId,
        chatId,
        username
      );

      let dbCtx = this.getDbContext(session.metadata);
      if (!dbCtx && persistenceService.isEnabled()) {
        const displayName = this.buildDisplayName(message);
        dbCtx = await persistenceService.startChannelSession(phone, channel, displayName);
        if (dbCtx) {
          session.metadata = { ...session.metadata, ...dbCtx };
        }
      }

      void telegramClient.sendChatAction(chatId, 'typing');

      const messageContent = telegramWebhookService.getMessageContent(message);

      const userMessage: ConversationMessage = {
        role: 'user',
        content: messageContent,
        timestamp: Date.now(),
        metadata: this.extractMessageMetadata(message),
      };
      conversationManager.addMessage(userId, userMessage);

      if (dbCtx) {
        await persistenceService.insertMessage(dbCtx.dbConversationId, 'user', messageContent);
      }

      const conversationHistory = conversationManager.getConversationHistory(userId);

      const knowledgeContext = knowledgeLoader.getContextForMessage(messageContent);
      const productCatalog = knowledgeLoader.getProductCatalogHint(
        persistenceService.getProductNames()
      );

      const agentRequest = {
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
      };

      const agentResponse = await agentClient.sendMessage(agentRequest);

      const { cleanText, events } = parseAgentEvents(agentResponse.response);

      const agentMessage: ConversationMessage = {
        role: 'agent',
        content: cleanText,
        timestamp: Date.now(),
        metadata: {
          ...((agentResponse.metadata || {}) as Record<string, unknown>),
        },
      };
      conversationManager.addMessage(userId, agentMessage);

      if (dbCtx) {
        await persistenceService.insertMessage(dbCtx.dbConversationId, 'assistant', cleanText);
        if (events) {
          await persistenceService.processEvents(dbCtx, events);
        }
      }

      await telegramClient.sendTextMessage(chatId, cleanText);

      logger.info('Mensaje procesado exitosamente', {
        userId,
        messageId: message.message_id,
        hadEvents: Boolean(events),
      });

      // 9. Guardar en Supabase (no bloquea la respuesta al usuario)
      void this.saveIntelligence(userId, username, messageContent, agentResponse.response);

      // 10. Cerrar sesión si el usuario se despidió
      if (conversationManager.isFarewell(messageContent)) {
        console.log(`[Sesión] Usuario ${userId} se despidió — cerrando sesión`);
        conversationManager.closeSession(userId);
      }
    } catch (error) {
      logger.error('Error procesando mensaje', {
        userId,
        messageId: message.message_id,
        error: error instanceof Error ? error.message : error,
      });

      await this.sendErrorMessage(chatId);
    }
  }

  private async saveIntelligence(
    userId: string,
    username: string | undefined,
    userMessage: string,
    agentResponse: string
  ): Promise<void> {
    console.log(`[Supabase] Analizando conversación de usuario ${userId}...`);
    try {
      const intelligence = await intelligenceExtractor.extract(userMessage, agentResponse, userId);
      if (!intelligence) {
        console.log(`[Supabase] ❌ NO guardado — el extractor no pudo analizar el mensaje`);
        return;
      }

      console.log(`[Supabase] Extracción: intención="${intelligence.intentType}" | productos=${intelligence.productInterests.join(', ') || 'ninguno'} | cita=${intelligence.appointmentRequest.detected}`);

      const dbUserId = await leadRepository.upsertUser(userId, username, intelligence);
      if (!dbUserId) return;

      const conversationId = await leadRepository.getOrCreateConversation(dbUserId);
      if (!conversationId) return;

      // Guardar IDs en la sesión para usarlos al cerrar
      conversationManager.updateMetadata(userId, {
        supabaseUserId: dbUserId,
        supabaseConversationId: conversationId,
      });

      await Promise.all([
        leadRepository.saveMessages(conversationId, userMessage, agentResponse),
        leadRepository.saveProductInterests(conversationId, intelligence),
        leadRepository.saveAppointmentRequest(dbUserId, conversationId, intelligence),
      ]);

      console.log(`[Supabase] ✅ Pipeline completo para usuario ${userId}`);
    } catch (error) {
      console.log(`[Supabase] ❌ Error en pipeline:`, error);
    }
  }

  /**
   * Procesa mensaje del chat web interno (asesores) — solo memoria, sin DB
   */
  async processWebChat(
    userId: string,
    messageContent: string,
    displayName?: string
  ): Promise<string> {
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
      metadata: {
        name: displayName,
        channel: 'web',
        persistEvents: false,
      },
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

  getStats() {
    return {
      conversationManager: conversationManager.getStats(),
      persistenceEnabled: persistenceService.isEnabled(),
    };
  }
}

export default new MessageOrchestrator();
