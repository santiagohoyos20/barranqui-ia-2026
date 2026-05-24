import { ConversationMessage } from './conversation.types';

export interface AgentRequest {
  userId: string;
  currentMessage: string;
  conversationHistory: ConversationMessage[];
  knowledgeContext?: string;
  metadata?: {
    chatId?: number;
    username?: string;
    name?: string;
    customData?: Record<string, any>;
  };
}

export interface AgentResponse {
  response: string;
  confidence?: number;
  nextActions?: string[];
  metadata?: Record<string, any>;
}

export interface AgentError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}
