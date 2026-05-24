import type { AgentResponse, ChatRequest } from '../types/chat'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/agent/chat'

export class ChatApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ChatApiError'
    this.status = status
  }
}

export async function sendMessage(payload: ChatRequest): Promise<AgentResponse> {
  const body = {
    message: payload.currentMessage,
    userId: payload.userId,
  }
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new ChatApiError(
      errorText || `Error del servidor (${response.status})`,
      response.status,
    )
  }

  return response.json() as Promise<AgentResponse>
}