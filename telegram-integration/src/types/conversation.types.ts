export interface ConversationMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  metadata?: {
    type?: 'text' | 'photo' | 'document' | 'audio' | 'voice' | 'video';
    fileId?: string;
    mimeType?: string;
    filename?: string;
    telegramMessageId?: number;
  };
}

export interface UserSession {
  userId: string;
  chatId?: number;
  username?: string;
  messages: ConversationMessage[];
  createdAt: number;
  lastMessageAt: number;
  metadata?: {
    dbUserId?: string;
    dbConversationId?: string;
    channel?: string;
    [key: string]: unknown;
  };
}

export interface ConversationContext {
  userId: string;
  chatId?: number;
  history: ConversationMessage[];
  currentMessageIndex: number;
}
