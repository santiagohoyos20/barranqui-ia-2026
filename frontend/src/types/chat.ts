export type MessageRole = 'user' | 'agent'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  intent?: string
  source?: string
  status?: 'sending' | 'sent' | 'error'
}

export interface ConversationEntry {
  role: MessageRole
  content: string
  timestamp: number
}

export interface ChatRequest {
  userId: string
  currentMessage: string
  conversationHistory: ConversationEntry[]
  metadata: {
    channel: 'web'
    type: 'text'
  }
}

export interface AgentResponse {
  response: string
  confidence?: number
  source?: string
  intent?: string
  nextActions?: string[]
}