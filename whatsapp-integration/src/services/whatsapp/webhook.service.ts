import logger from '../../utils/logger';
import { WhatsAppMessageBody, WhatsAppMessage } from '../../types/whatsapp.types';
import { config } from '../../config/env';
import crypto from 'crypto';

class WhatsAppWebhookService {
  /**
   * Valida el webhook de WhatsApp usando el token
   */
  validateWebhookToken(token: string): boolean {
    const isValid = token === config.whatsapp.webhookToken;
    if (!isValid) {
      logger.warn('Token de webhook inválido');
    }
    return isValid;
  }

  /**
   * Valida la firma del webhook (X-Hub-Signature)
   * Esto es recomendado por Meta para mayor seguridad
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha256', config.whatsapp.accessToken)
        .update(payload)
        .digest('hex');

      const expectedSignature = `sha256=${hash}`;
      return signature === expectedSignature;
    } catch (error) {
      logger.error('Error validando firma webhook', { error });
      return false;
    }
  }

  /**
   * Extrae los mensajes del payload del webhook
   */
  extractMessages(body: WhatsAppMessageBody): WhatsAppMessage[] {
    const messages: WhatsAppMessage[] = [];

    try {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          if (change.value.messages) {
            messages.push(...change.value.messages);
          }
        });
      });

      logger.debug(`${messages.length} mensaje(s) extraído(s) del webhook`);
    } catch (error) {
      logger.error('Error extrayendo mensajes del webhook', { error });
    }

    return messages;
  }

  /**
   * Valida que un mensaje sea válido
   */
  isValidMessage(message: WhatsAppMessage): boolean {
    return !!(
      message.from &&
      message.id &&
      message.timestamp &&
      (message.text?.body || message.type !== 'text')
    );
  }

  /**
   * Obtiene el contenido del mensaje (soporta texto y metadatos de archivos)
   */
  getMessageContent(message: WhatsAppMessage): string {
    if (message.type === 'text' && message.text?.body) {
      return message.text.body;
    }

    // Para archivos, retorna metadata
    if (message.image) {
      return `[Imagen enviada - ID: ${message.image.id}]`;
    }
    if (message.document) {
      return `[Documento enviado: ${message.document.filename} - ID: ${message.document.id}]`;
    }
    if (message.audio) {
      return `[Audio enviado - ID: ${message.audio.id}]`;
    }
    if (message.video) {
      return `[Video enviado - ID: ${message.video.id}]`;
    }

    return `[Mensaje tipo ${message.type}]`;
  }

  /**
   * Procesa un webhook del tipo "status" (entregas, lecturas)
   */
  extractStatuses(body: WhatsAppMessageBody): Array<{ id: string; status: string }> {
    const statuses: Array<{ id: string; status: string }> = [];

    try {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          if (change.value.statuses) {
            change.value.statuses.forEach(status => {
              statuses.push({
                id: status.id,
                status: status.status,
              });
            });
          }
        });
      });

      if (statuses.length > 0) {
        logger.debug(`${statuses.length} actualización(es) de estado extraída(s)`);
      }
    } catch (error) {
      logger.error('Error extrayendo estados', { error });
    }

    return statuses;
  }
}

export default new WhatsAppWebhookService();
