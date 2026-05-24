import logger from '../../utils/logger';
import {
  TelegramMessage,
  TelegramMessageType,
  TelegramUpdate,
} from '../../types/telegram.types';
import { config } from '../../config/env';

class TelegramWebhookService {
  /**
   * Valida la cabecera X-Telegram-Bot-Api-Secret-Token enviada por Telegram.
   * Esta cabecera contiene el secret_token configurado al registrar el webhook.
   * Ver: https://core.telegram.org/bots/api#setwebhook
   */
  validateSecretToken(headerToken: string | undefined): boolean {
    const expected = config.telegram.webhookSecretToken;

    // Si el usuario no configuró el secret token, no hay nada que validar
    // (no recomendado en producción, pero permite pruebas locales).
    if (!expected) {
      return true;
    }

    const isValid = headerToken === expected;
    if (!isValid) {
      logger.warn('Secret token de webhook inválido');
    }
    return isValid;
  }

  /**
   * Extrae los mensajes "útiles" del Update recibido por Telegram.
   * Soporta `message` y `edited_message`.
   */
  extractMessages(update: TelegramUpdate): TelegramMessage[] {
    const messages: TelegramMessage[] = [];

    try {
      if (update.message) {
        messages.push(update.message);
      }
      if (update.edited_message) {
        messages.push(update.edited_message);
      }

      logger.debug(`${messages.length} mensaje(s) extraído(s) del update`, {
        updateId: update.update_id,
      });
    } catch (error) {
      logger.error('Error extrayendo mensajes del update', { error });
    }

    return messages;
  }

  /**
   * Valida que un mensaje sea válido y procesable
   */
  isValidMessage(message: TelegramMessage): boolean {
    return !!(
      message &&
      message.message_id &&
      message.chat?.id &&
      message.from?.id &&
      this.detectMessageType(message) !== 'unknown'
    );
  }

  /**
   * Detecta el tipo de mensaje
   */
  detectMessageType(message: TelegramMessage): TelegramMessageType {
    if (message.text) return 'text';
    if (message.photo && message.photo.length > 0) return 'photo';
    if (message.document) return 'document';
    if (message.audio) return 'audio';
    if (message.voice) return 'voice';
    if (message.video) return 'video';
    return 'unknown';
  }

  /**
   * Obtiene una representación textual del contenido del mensaje
   * (útil para logs y para enviar al agente cuando no es texto plano).
   */
  getMessageContent(message: TelegramMessage): string {
    const type = this.detectMessageType(message);

    if (type === 'text' && message.text) {
      return message.text;
    }

    if (type === 'photo' && message.photo && message.photo.length > 0) {
      const largest = message.photo[message.photo.length - 1];
      const caption = message.caption ? ` - Caption: ${message.caption}` : '';
      return `[Imagen recibida - ID: ${largest.file_id}${caption}]`;
    }

    if (type === 'document' && message.document) {
      const name = message.document.file_name || 'archivo';
      return `[Documento recibido: ${name} - ID: ${message.document.file_id}]`;
    }

    if (type === 'audio' && message.audio) {
      return `[Audio recibido - ID: ${message.audio.file_id}]`;
    }

    if (type === 'voice' && message.voice) {
      return `[Nota de voz recibida - ID: ${message.voice.file_id}]`;
    }

    if (type === 'video' && message.video) {
      return `[Video recibido - ID: ${message.video.file_id}]`;
    }

    return `[Mensaje no soportado]`;
  }
}

export default new TelegramWebhookService();
