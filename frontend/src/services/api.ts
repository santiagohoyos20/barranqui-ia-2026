import type { AgentResponse } from '../types/chat'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/chat'

export class ChatApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ChatApiError'
    this.status = status
  }
}

/** Envía el mensaje tal cual lo escribió el usuario */
export async function sendMessage(message: string): Promise<AgentResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
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
