import axios, { AxiosInstance, AxiosError } from 'axios';
import logger from '../../utils/logger';
import { AgentRequest, AgentResponse, AgentError } from '../../types/agent.types';
import { config } from '../../config/env';

class AgentClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.agent.apiUrl,
      timeout: config.agent.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.agent.apiKey && { Authorization: `Bearer ${config.agent.apiKey}` }),
      },
    });
  }

  /**
   * Envía un mensaje al agente IA
   * Implementa reintentos exponenciales en caso de fallo
   */
  async sendMessage(request: AgentRequest): Promise<AgentResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.agent.retries; attempt++) {
      try {
        logger.info(`Enviando mensaje al agente (intento ${attempt}/${config.agent.retries})`, {
          userId: request.userId,
          messageLength: request.currentMessage.length,
        });

        const response = await this.client.post<AgentResponse>('/chat', request);

        logger.info('Respuesta recibida del agente', {
          userId: request.userId,
          confidence: response.data.confidence,
        });

        return response.data;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Error en intento ${attempt}`, {
          userId: request.userId,
          error: (error as AxiosError)?.message || error,
        });

        // Si no es el último intento, espera antes de reintentar
        if (attempt < config.agent.retries) {
          const delay = config.agent.retryDelay * Math.pow(2, attempt - 1);
          logger.debug(`Esperando ${delay}ms antes de reintentar...`);
          await this.sleep(delay);
        }
      }
    }

    // Si llegamos aquí, todos los reintentos fallaron
    throw new Error(
      `No se pudo conectar al agente después de ${config.agent.retries} intentos: ${lastError?.message}`
    );
  }

  /**
   * Prueba la conexión con el agente
   */
  async healthCheck(): Promise<boolean> {
    try {
      logger.debug('Realizando health check al agente...');
      await this.client.get('/health');
      logger.info('Agente disponible ✓');
      return true;
    } catch (error) {
      logger.error('Agente no disponible ✗', {
        error: (error as AxiosError)?.message || error,
      });
      return false;
    }
  }

  /**
   * Obtiene información del agente
   */
  async getInfo(): Promise<Record<string, any>> {
    try {
      logger.debug('Obteniendo información del agente...');
      const response = await this.client.get('/info');
      return response.data;
    } catch (error) {
      logger.error('Error obteniendo info del agente', {
        error: (error as AxiosError)?.message || error,
      });
      throw error;
    }
  }

  /**
   * Función auxiliar para dormir
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new AgentClient();
