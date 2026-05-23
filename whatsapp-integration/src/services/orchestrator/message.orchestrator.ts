import logger from '../../utils/logger';
import conversationManager from '../conversation/manager.service';
import agentClient from '../agent/client.service';
import whatsappClient from '../whatsapp/client.service';
import { WhatsAppMessage } from '../../types/whatsapp.types';
import { ConversationMessage } from '../../types/conversation.types';

class MessageOrchestrator {
  /**
   * Procesa un mensaje recibido de WhatsApp
   * Flujo: WhatsApp → Conversation Manager → Agent → WhatsApp
   */
  async processMessage(message: WhatsAppMessage): Promise<void> {
    const userId = message.from;
    const phone = message.from;

    try {
      logger.info('Iniciando procesamiento de mensaje', {
        userId,
        messageId: message.id,
        type: message.type,
      });

      // 1. Obtener o crear sesión del usuario
      const session = conversationManager.getOrCreateSession(userId, phone);
      logger.debug('Sesión obtenida/creada', { userId, messagesCount: session.messages.length });

      // 2. Extraer contenido del mensaje
      const messageContent = this.extractMessageContent(message);
      logger.debug('Contenido extraído', { userId, contentLength: messageContent.length });

      // 3. Agregar mensaje del usuario al contexto
      const userMessage: ConversationMessage = {
        role: 'user',
        content: messageContent,
        timestamp: Date.now(),
        metadata: this.extractMessageMetadata(message),
      };
      conversationManager.addMessage(userId, userMessage);

      // 4. Obtener historial de conversación
      const conversationHistory = conversationManager.getConversationHistory(userId);
      logger.debug('Historial de conversación obtenido', {
        userId,
        historyLength: conversationHistory.length,
      });

      // 5. Enviar al agente IA
      logger.info('Enviando mensaje al agente IA', { userId });

      const agentRequest = {
        userId,
        currentMessage: messageContent,
        conversationHistory,
        metadata: {
          phone,
          type: message.type,
        },
      };

      const agentResponse = await agentClient.sendMessage(agentRequest);
      logger.info('Respuesta recibida del agente', {
        userId,
        confidence: agentResponse.confidence,
      });

      // 6. Agregar respuesta del agente al contexto
      const agentMessage: ConversationMessage = {
        role: 'agent',
        content: agentResponse.response,
        timestamp: Date.now(),
        metadata: {
          confidence: agentResponse.confidence,
          nextActions: agentResponse.nextActions,
        },
      };
      conversationManager.addMessage(userId, agentMessage);

      // 7. Enviar respuesta a WhatsApp
      logger.info('Enviando respuesta a WhatsApp', { userId, phone });

      await whatsappClient.sendTextMessage(phone, agentResponse.response);

      logger.info('Mensaje procesado exitosamente', { userId, messageId: message.id });
    } catch (error) {
      logger.error('Error procesando mensaje', {
        userId,
        messageId: message.id,
        error: error instanceof Error ? error.message : error,
      });

      // Enviar mensaje de error al usuario
      await this.sendErrorMessage(phone);
    }
  }

  /**
   * Extrae el contenido del mensaje
   */
  private extractMessageContent(message: WhatsAppMessage): string {
    if (message.type === 'text' && message.text?.body) {
      return message.text.body;
    }

    if (message.image) {
      return `[Imagen compartida]`;
    }

    if (message.document) {
      return `[Documento compartido: ${message.document.filename}]`;
    }

    if (message.audio) {
      return `[Audio compartido]`;
    }

    if (message.video) {
      return `[Video compartido]`;
    }

    return `[Mensaje de tipo ${message.type}]`;
  }

  /**
   * Extrae metadatos del mensaje
   */
  private extractMessageMetadata(
    message: WhatsAppMessage
  ): Record<string, any> {
    const metadata: Record<string, any> = {
      type: message.type,
      whatsappMessageId: message.id,
    };

    if (message.image) {
      metadata.fileId = message.image.id;
      metadata.mimeType = message.image.mime_type;
    }

    if (message.document) {
      metadata.fileId = message.document.id;
      metadata.filename = message.document.filename;
      metadata.mimeType = message.document.mime_type;
    }

    if (message.audio) {
      metadata.fileId = message.audio.id;
      metadata.mimeType = message.audio.mime_type;
    }

    if (message.video) {
      metadata.fileId = message.video.id;
      metadata.mimeType = message.video.mime_type;
    }

    return metadata;
  }

  /**
   * Envía mensaje de error al usuario
   */
  private async sendErrorMessage(phone: string): Promise<void> {
    try {
      const errorMessage =
        'Disculpa, tenemos un problema procesando tu solicitud. Por favor intenta de nuevo.';
      await whatsappClient.sendTextMessage(phone, errorMessage);
    } catch (error) {
      logger.error('Error enviando mensaje de error a usuario', {
        phone,
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
