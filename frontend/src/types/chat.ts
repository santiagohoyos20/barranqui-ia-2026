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

export interface AgentResponse {
  response: string
  confidence?: number
  source?: string
  intent?: string
  nextActions?: string[]
}
