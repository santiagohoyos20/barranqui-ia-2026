import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { UserSession, ConversationMessage, ConversationContext } from '../../types/conversation.types';
import { config } from '../../config/env';

class ConversationManager {
  private conversationStorage: Map<string, UserSession> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Obtiene o crea una sesión de usuario
   */
  getOrCreateSession(userId: string, phone: string): UserSession {
    let session = this.conversationStorage.get(userId);

    if (!session) {
      session = {
        userId,
        phone,
        messages: [],
        createdAt: Date.now(),
        lastMessageAt: Date.now(),
        metadata: {},
      };
      this.conversationStorage.set(userId, session);
      logger.info(`Nueva sesión creada para usuario ${userId}`);
    } else {
      session.lastMessageAt = Date.now();
    }

    return session;
  }

  /**
   * Agrega un mensaje a la conversación del usuario
   */
  addMessage(userId: string, message: ConversationMessage): void {
    const session = this.conversationStorage.get(userId);
    if (!session) {
      logger.warn(`Sesión no encontrada para usuario ${userId}`);
      return;
    }

    // Limitar cantidad de mensajes
    if (session.messages.length >= config.conversation.maxMessages) {
      session.messages.shift(); // Elimina el más antiguo
      logger.debug(`Límite de mensajes alcanzado para usuario ${userId}, eliminado más antiguo`);
    }

    session.messages.push(message);
    session.lastMessageAt = Date.now();

    logger.debug(`Mensaje agregado para usuario ${userId}. Total: ${session.messages.length}`);
  }

  /**
   * Obtiene el contexto de conversación de un usuario
   */
  getConversationContext(userId: string): ConversationContext | null {
    const session = this.conversationStorage.get(userId);
    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      phone: session.phone,
      history: session.messages,
      currentMessageIndex: session.messages.length - 1,
    };
  }

  /**
   * Obtiene el historial de conversación formateado para el agente
   */
  getConversationHistory(userId: string): ConversationMessage[] {
    const session = this.conversationStorage.get(userId);
    if (!session) {
      return [];
    }

    return session.messages;
  }

  /**
   * Limpia la sesión de un usuario
   */
  clearSession(userId: string): void {
    this.conversationStorage.delete(userId);
    logger.info(`Sesión borrada para usuario ${userId}`);
  }

  /**
   * Obtiene información sobre la sesión
   */
  getSessionInfo(userId: string): Partial<UserSession> | null {
    const session = this.conversationStorage.get(userId);
    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      phone: session.phone,
      createdAt: session.createdAt,
      lastMessageAt: session.lastMessageAt,
    };
  }

  /**
   * Obtiene estadísticas de todas las sesiones
   */
  getStats(): {
    activeSessions: number;
    totalMessages: number;
    sessions: Array<{ userId: string; messageCount: number; lastActivity: string }>;
  } {
    let totalMessages = 0;
    const sessions: Array<{ userId: string; messageCount: number; lastActivity: string }> = [];

    this.conversationStorage.forEach(session => {
      totalMessages += session.messages.length;
      sessions.push({
        userId: session.userId,
        messageCount: session.messages.length,
        lastActivity: new Date(session.lastMessageAt).toISOString(),
      });
    });

    return {
      activeSessions: this.conversationStorage.size,
      totalMessages,
      sessions,
    };
  }

  /**
   * Inicia el intervalo de limpieza de sesiones inactivas
   */
  private startCleanupInterval(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, config.conversation.cleanupInterval);

    logger.info('Intervalo de limpieza de sesiones iniciado');
  }

  /**
   * Limpia sesiones inactivas
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, session] of this.conversationStorage.entries()) {
      if (now - session.lastMessageAt > config.conversation.idleTimeout) {
        this.conversationStorage.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Limpieza: ${cleaned} sesiones inactivas eliminadas`);
    }
  }

  /**
   * Detiene el intervalo de limpieza
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      logger.info('Intervalo de limpieza detenido');
    }
  }
}

export default new ConversationManager();
