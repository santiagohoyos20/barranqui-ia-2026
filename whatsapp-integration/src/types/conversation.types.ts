export interface ConversationMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  metadata?: {
    type?: 'text' | 'image' | 'document' | 'audio' | 'video';
    fileId?: string;
    mimeType?: string;
    filename?: string;
  };
}

export interface UserSession {
  userId: string;
  phone: string;
  messages: ConversationMessage[];
  createdAt: number;
  lastMessageAt: number;
  metadata?: Record<string, any>;
}

export interface ConversationContext {
  userId: string;
  phone: string;
  history: ConversationMessage[];
  currentMessageIndex: number;
}
