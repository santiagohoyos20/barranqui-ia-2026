import { useCallback, useState } from 'react'
import { ChatApiError, sendMessage } from '../services/api'
import type { ChatMessage } from '../types/chat'

function createId(): string {
  return crypto.randomUUID()
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'agent',
  content:
    '¡Hola! Soy tu asistente de Serfinanza. Puedes escribirme en tus propias palabras: por ejemplo, "Gasté 50 mil en mercado" o "¿Cuáles son los horarios de atención?". Yo me encargo del resto.',
  timestamp: Date.now(),
  status: 'sent',
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      setError(null)

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
        status: 'sending',
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const agentReply = await sendMessage(trimmed)

        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id ? { ...m, status: 'sent' } : m,
          ),
        )

        const agentMessage: ChatMessage = {
          id: createId(),
          role: 'agent',
          content: agentReply.response,
          timestamp: Date.now(),
          intent: agentReply.intent,
          source: agentReply.source,
          status: 'sent',
        }

        setMessages((prev) => [...prev, agentMessage])
      } catch (err) {
        const message =
          err instanceof ChatApiError
            ? err.message
            : 'No pudimos conectar con el servidor. Verifica que el backend esté activo.'

        setError(message)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id ? { ...m, status: 'error' } : m,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading],
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    messages,
    isLoading,
    error,
    sendUserMessage,
    clearError,
  }
}
