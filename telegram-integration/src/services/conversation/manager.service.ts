import logger from '../../utils/logger';
import {
  UserSession,
  ConversationMessage,
  ConversationContext,
} from '../../types/conversation.types';
import { config } from '../../config/env';

type SessionCloseCallback = (session: UserSession) => void;

const FAREWELL_PATTERN = /\b(chao|chau|adi[oó]s|bye|hasta luego|hasta pronto|nos vemos|hasta ma[nñ]ana)\b/i;

class ConversationManager {
  private conversationStorage: Map<string, UserSession> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private onCloseCallback: SessionCloseCallback | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  onSessionClose(callback: SessionCloseCallback): void {
    this.onCloseCallback = callback;
  }

  isFarewell(message: string): boolean {
    return FAREWELL_PATTERN.test(message);
  }

  closeSession(userId: string): void {
    const session = this.conversationStorage.get(userId);
    if (!session) return;
    this.conversationStorage.delete(userId);
    console.log(`[Sesión] Cerrada para usuario ${userId}`);
    this.onCloseCallback?.(session);
  }

  updateMetadata(userId: string, data: Record<string, unknown>): void {
    const session = this.conversationStorage.get(userId);
    if (!session) return;
    session.metadata = { ...session.metadata, ...data };
  }

  /**
   * Obtiene o crea una sesión de usuario
   */
  getOrCreateSession(
    userId: string,
    chatId?: number,
    username?: string
  ): UserSession {
    let session = this.conversationStorage.get(userId);

    if (!session) {
      session = {
        userId,
        chatId,
        username,
        messages: [],
        createdAt: Date.now(),
        lastMessageAt: Date.now(),
        metadata: {},
      };
      this.conversationStorage.set(userId, session);
      logger.info(`Nueva sesión creada para usuario ${userId}`);
    } else {
      session.lastMessageAt = Date.now();
      if (chatId !== undefined) session.chatId = chatId;
      if (username) session.username = username;
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

    if (session.messages.length >= config.conversation.maxMessages) {
      session.messages.shift();
      logger.debug(
        `Límite de mensajes alcanzado para usuario ${userId}, eliminado más antiguo`
      );
    }

    session.messages.push(message);
    session.lastMessageAt = Date.now();

    logger.debug(
      `Mensaje agregado para usuario ${userId}. Total: ${session.messages.length}`
    );
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
      chatId: session.chatId,
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
      chatId: session.chatId,
      username: session.username,
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
    sessions: Array<{
      userId: string;
      chatId?: number;
      messageCount: number;
      lastActivity: string;
    }>;
  } {
    let totalMessages = 0;
    const sessions: Array<{
      userId: string;
      chatId?: number;
      messageCount: number;
      lastActivity: string;
    }> = [];

    this.conversationStorage.forEach(session => {
      totalMessages += session.messages.length;
      sessions.push({
        userId: session.userId,
        chatId: session.chatId,
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
        console.log(`[Sesión] Cerrada por inactividad — usuario ${userId}`);
        this.onCloseCallback?.(session);
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
