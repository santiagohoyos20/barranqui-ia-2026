import Anthropic from '@anthropic-ai/sdk';
import logger from '../../utils/logger';
import { AgentRequest, AgentResponse } from '../../types/agent.types';
import { ConversationMessage } from '../../types/conversation.types';
import { config } from '../../config/env';
import { buildEventsPromptSection } from '../../utils/eventParser';

class AgentClient {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.agent.apiKey,
      timeout: config.agent.timeout,
    });
  }

  async sendMessage(request: AgentRequest): Promise<AgentResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.agent.retries; attempt++) {
      try {
        logger.info(`Enviando mensaje al agente (intento ${attempt}/${config.agent.retries})`, {
          userId: request.userId,
          messageLength: request.currentMessage.length,
        });

        const messages = this.buildMessages(request.conversationHistory, request.currentMessage);
        const systemPrompt = this.buildSystemPrompt(request);

        logger.info(`[Agent] System prompt: ${systemPrompt.length} chars | knowledge: ${request.knowledgeContext ? `${request.knowledgeContext.length} chars` : 'ninguno'}`);

        const stream = this.client.messages.stream({
          model: config.agent.model,
          max_tokens: 4000,
          system: systemPrompt,
          messages,
        });

        const message = await stream.finalMessage();
        const textBlock = message.content.find(b => b.type === 'text');
        const responseText = textBlock ? (textBlock as Anthropic.TextBlock).text.replace(/\*\*/g, '') : '';

        logger.info('Respuesta recibida del agente', {
          userId: request.userId,
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        });

        return {
          response: responseText,
          confidence: 1,
          metadata: {
            model: message.model,
            usage: message.usage,
            stopReason: message.stop_reason,
          },
        };
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Error en intento ${attempt}`, {
          userId: request.userId,
          error: (error as Error)?.message || error,
        });

        if (attempt < config.agent.retries) {
          const delay = config.agent.retryDelay * Math.pow(2, attempt - 1);
          logger.debug(`Esperando ${delay}ms antes de reintentar...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `No se pudo obtener respuesta del agente después de ${config.agent.retries} intentos: ${lastError?.message}`
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      logger.debug('Realizando health check al agente...');
      await this.client.models.retrieve(config.agent.model);
      logger.info('Agente disponible ✓');
      return true;
    } catch (error) {
      logger.error('Agente no disponible ✗', {
        error: (error as Error)?.message || error,
      });
      return false;
    }
  }

  async getInfo(): Promise<Record<string, any>> {
    try {
      logger.debug('Obteniendo información del agente...');
      const model = await this.client.models.retrieve(config.agent.model);
      return {
        model: model.id,
        displayName: model.display_name,
        createdAt: model.created_at,
      };
    } catch (error) {
      logger.error('Error obteniendo info del agente', {
        error: (error as Error)?.message || error,
      });
      throw error;
    }
  }

  private buildMessages(
    history: ConversationMessage[],
    currentMessage: string
  ): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = history.map(msg => ({
      role: msg.role === 'agent' ? 'assistant' : 'user',
      content: msg.content,
    }));

    messages.push({ role: 'user', content: currentMessage });
    return messages;
  }

  private buildSystemPrompt(request: AgentRequest): string {
    let prompt = config.agent.systemPrompt;

    if (request.knowledgeContext) {
      prompt += `\n\n${request.knowledgeContext}\n\n` +
        'Usa la información de productos anterior para responder. ' +
        'Si la respuesta no está en esa información, indícalo claramente y sugiere contactar al banco.';
    }

    if (request.metadata?.name) {
      prompt += `\n\nEstás hablando con ${request.metadata.name}.`;
    }

    if (request.metadata?.persistEvents) {
      prompt += `\n\n${buildEventsPromptSection()}`;
    }

    return prompt;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new AgentClient();
