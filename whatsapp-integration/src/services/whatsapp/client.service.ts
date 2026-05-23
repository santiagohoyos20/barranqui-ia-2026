import axios, { AxiosInstance, AxiosError } from 'axios';
import logger from '../../utils/logger';
import { WhatsAppSendMessagePayload, WhatsAppError } from '../../types/whatsapp.types';
import { config } from '../../config/env';

class WhatsAppClient {
  private client: AxiosInstance;
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${config.whatsapp.baseUrl}/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}`;

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Envía un mensaje de texto a un usuario
   */
  async sendTextMessage(to: string, text: string): Promise<string> {
    try {
      logger.info('Enviando mensaje de texto', { to, messageLength: text.length });

      const payload: WhatsAppSendMessagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          body: text,
        },
      };

      const response = await this.client.post<{ messages: Array<{ id: string }> }>(
        '/messages',
        payload
      );

      const messageId = response.data.messages[0].id;
      logger.info('Mensaje de texto enviado', { to, messageId });

      return messageId;
    } catch (error) {
      this.handleError('Error enviando mensaje de texto', error, { to });
      throw error;
    }
  }

  /**
   * Envía una imagen a un usuario
   */
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<string> {
    try {
      logger.info('Enviando imagen', { to });

      const payload: WhatsAppSendMessagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: {
          link: imageUrl,
        },
      };

      const response = await this.client.post<{ messages: Array<{ id: string }> }>(
        '/messages',
        payload
      );

      const messageId = response.data.messages[0].id;
      logger.info('Imagen enviada', { to, messageId });

      return messageId;
    } catch (error) {
      this.handleError('Error enviando imagen', error, { to });
      throw error;
    }
  }

  /**
   * Envía un documento a un usuario
   */
  async sendDocument(to: string, fileUrl: string, filename: string): Promise<string> {
    try {
      logger.info('Enviando documento', { to, filename });

      const payload: WhatsAppSendMessagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'document',
        document: {
          link: fileUrl,
          filename,
        },
      };

      const response = await this.client.post<{ messages: Array<{ id: string }> }>(
        '/messages',
        payload
      );

      const messageId = response.data.messages[0].id;
      logger.info('Documento enviado', { to, messageId });

      return messageId;
    } catch (error) {
      this.handleError('Error enviando documento', error, { to });
      throw error;
    }
  }

  /**
   * Marca un mensaje como leído
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      logger.debug('Marcando mensaje como leído', { messageId });

      await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });

      logger.debug('Mensaje marcado como leído', { messageId });
    } catch (error) {
      logger.warn('Error marcando mensaje como leído', { messageId, error });
      // No lanzamos error ya que esto no es crítico
    }
  }

  /**
   * Obtiene la URL de un media (archivo, imagen, etc.) usando su ID
   */
  async getMediaUrl(mediaId: string): Promise<string | null> {
    try {
      logger.debug('Obteniendo URL de media', { mediaId });

      const response = await this.client.get<{
        url?: string;
        mime_type?: string;
      }>(`/${mediaId}`);

      logger.debug('URL de media obtenida', { mediaId });
      return response.data.url || null;
    } catch (error) {
      logger.error('Error obteniendo URL de media', { mediaId, error });
      return null;
    }
  }

  /**
   * Prueba la conexión con la API de WhatsApp
   */
  async healthCheck(): Promise<boolean> {
    try {
      logger.debug('Realizando health check a WhatsApp API...');
      await this.client.get(`/${config.whatsapp.phoneNumberId}`);
      logger.info('WhatsApp API disponible ✓');
      return true;
    } catch (error) {
      logger.error('WhatsApp API no disponible ✗', {
        error: (error as AxiosError)?.message || error,
      });
      return false;
    }
  }

  /**
   * Maneja errores de WhatsApp API
   */
  private handleError(
    message: string,
    error: any,
    context?: Record<string, any>
  ): void {
    if (axios.isAxiosError(error)) {
      const whatsappError = error.response?.data as WhatsAppError;
      logger.error(message, {
        status: error.response?.status,
        errorCode: whatsappError?.error?.code,
        errorMessage: whatsappError?.error?.message || error.message,
        ...context,
      });
    } else {
      logger.error(message, {
        error: error?.message || error,
        ...context,
      });
    }
  }
}

export default new WhatsAppClient();
