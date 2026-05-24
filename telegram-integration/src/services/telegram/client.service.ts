import axios, { AxiosInstance, AxiosError } from 'axios';
import logger from '../../utils/logger';
import {
  TelegramApiResponse,
  TelegramFile,
  TelegramMessage,
  TelegramSendDocumentPayload,
  TelegramSendMessagePayload,
  TelegramSendPhotoPayload,
  TelegramUser,
} from '../../types/telegram.types';
import { config } from '../../config/env';

class TelegramClient {
  private client: AxiosInstance;
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${config.telegram.apiBaseUrl}/bot${config.telegram.botToken}`;

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * Envía un mensaje de texto a un chat
   */
  async sendTextMessage(chatId: number | string, text: string): Promise<number> {
    try {
      logger.info('Enviando mensaje de texto', {
        chatId,
        messageLength: text.length,
      });

      const payload: TelegramSendMessagePayload = {
        chat_id: chatId,
        text,
      };

      const response = await this.client.post<TelegramApiResponse<TelegramMessage>>(
        '/sendMessage',
        payload
      );

      this.assertOk(response.data);

      const messageId = response.data.result!.message_id;
      logger.info('Mensaje de texto enviado', { chatId, messageId });

      return messageId;
    } catch (error) {
      this.handleError('Error enviando mensaje de texto', error, { chatId });
      throw error;
    }
  }

  /**
   * Envía una imagen a un chat
   */
  async sendImage(
    chatId: number | string,
    photo: string,
    caption?: string
  ): Promise<number> {
    try {
      logger.info('Enviando imagen', { chatId });

      const payload: TelegramSendPhotoPayload = {
        chat_id: chatId,
        photo,
        caption,
      };

      const response = await this.client.post<TelegramApiResponse<TelegramMessage>>(
        '/sendPhoto',
        payload
      );

      this.assertOk(response.data);

      const messageId = response.data.result!.message_id;
      logger.info('Imagen enviada', { chatId, messageId });

      return messageId;
    } catch (error) {
      this.handleError('Error enviando imagen', error, { chatId });
      throw error;
    }
  }

  /**
   * Envía un documento a un chat
   */
  async sendDocument(
    chatId: number | string,
    document: string,
    caption?: string
  ): Promise<number> {
    try {
      logger.info('Enviando documento', { chatId });

      const payload: TelegramSendDocumentPayload = {
        chat_id: chatId,
        document,
        caption,
      };

      const response = await this.client.post<TelegramApiResponse<TelegramMessage>>(
        '/sendDocument',
        payload
      );

      this.assertOk(response.data);

      const messageId = response.data.result!.message_id;
      logger.info('Documento enviado', { chatId, messageId });

      return messageId;
    } catch (error) {
      this.handleError('Error enviando documento', error, { chatId });
      throw error;
    }
  }

  /**
   * Indica que el bot está "escribiendo..." en el chat
   */
  async sendChatAction(
    chatId: number | string,
    action:
      | 'typing'
      | 'upload_photo'
      | 'upload_document'
      | 'record_voice'
      | 'upload_voice' = 'typing'
  ): Promise<void> {
    try {
      await this.client.post('/sendChatAction', {
        chat_id: chatId,
        action,
      });
    } catch (error) {
      logger.warn('Error enviando chat action', { chatId, action, error });
      // No es crítico, no propagamos el error
    }
  }

  /**
   * Obtiene la URL pública para descargar un archivo a partir de su file_id
   */
  async getFileUrl(fileId: string): Promise<string | null> {
    try {
      logger.debug('Obteniendo metadata de archivo', { fileId });

      const response = await this.client.get<TelegramApiResponse<TelegramFile>>(
        '/getFile',
        { params: { file_id: fileId } }
      );

      this.assertOk(response.data);

      const filePath = response.data.result?.file_path;
      if (!filePath) {
        return null;
      }

      const fileUrl = `${config.telegram.apiBaseUrl}/file/bot${config.telegram.botToken}/${filePath}`;
      logger.debug('URL de archivo obtenida', { fileId });
      return fileUrl;
    } catch (error) {
      logger.error('Error obteniendo URL de archivo', { fileId, error });
      return null;
    }
  }

  /**
   * Registra el webhook en Telegram (úsalo una vez al desplegar)
   */
  async setWebhook(url: string, secretToken?: string): Promise<boolean> {
    try {
      logger.info('Registrando webhook en Telegram', { url });

      const response = await this.client.post<TelegramApiResponse<boolean>>(
        '/setWebhook',
        {
          url,
          secret_token: secretToken || undefined,
          allowed_updates: ['message', 'edited_message'],
        }
      );

      this.assertOk(response.data);

      logger.info('Webhook registrado correctamente ✓', { url });
      return true;
    } catch (error) {
      this.handleError('Error registrando webhook', error, { url });
      return false;
    }
  }

  /**
   * Elimina el webhook registrado en Telegram
   */
  async deleteWebhook(): Promise<boolean> {
    try {
      const response = await this.client.post<TelegramApiResponse<boolean>>(
        '/deleteWebhook'
      );
      this.assertOk(response.data);
      logger.info('Webhook eliminado en Telegram');
      return true;
    } catch (error) {
      this.handleError('Error eliminando webhook', error);
      return false;
    }
  }

  /**
   * Prueba la conexión con la API de Telegram (getMe)
   */
  async healthCheck(): Promise<boolean> {
    try {
      logger.debug('Realizando health check a Telegram API...');
      const response = await this.client.get<TelegramApiResponse<TelegramUser>>(
        '/getMe'
      );

      if (!response.data.ok) {
        logger.error('Telegram API respondió con error', {
          description: response.data.description,
        });
        return false;
      }

      logger.info('Telegram API disponible ✓', {
        botUsername: response.data.result?.username,
      });
      return true;
    } catch (error) {
      logger.error('Telegram API no disponible ✗', {
        error: (error as AxiosError)?.message || error,
      });
      return false;
    }
  }

  /**
   * Verifica que la respuesta de Telegram sea válida
   */
  private assertOk<T>(data: TelegramApiResponse<T>): void {
    if (!data.ok) {
      throw new Error(
        `Telegram API error (${data.error_code}): ${data.description || 'unknown'}`
      );
    }
  }

  /**
   * Maneja errores de la API de Telegram
   */
  private handleError(
    message: string,
    error: any,
    context?: Record<string, any>
  ): void {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as TelegramApiResponse<unknown> | undefined;
      logger.error(message, {
        status: error.response?.status,
        errorCode: data?.error_code,
        errorDescription: data?.description || error.message,
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

export default new TelegramClient();
