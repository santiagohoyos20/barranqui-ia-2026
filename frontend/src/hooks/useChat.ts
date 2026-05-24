import { useCallback, useMemo, useState } from 'react'
import { pickRandomChatSuggestions } from '../constants/chatSuggestions'
import { ChatApiError, sendMessage } from '../services/api'
import type { ChatMessage } from '../types/chat'

function createId(): string {
  return crypto.randomUUID()
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'agent',
  content:
    '¡Hola! Soy tu asistente de Serfinanza. Puedes escribirme en tus propias palabras. Yo me encargo del resto.',
  timestamp: Date.now(),
  status: 'sent',
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const suggestions = useMemo(() => pickRandomChatSuggestions(3), [])

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      setError(null)
      setShowSuggestions(false)

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
        const conversationHistory = [...messages, userMessage]
          .filter((message) => message.id !== 'welcome')
          .filter((message) => message.role === 'user' || message.role === 'agent')
          .map((message) => ({
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
          }))

        const agentReply = await sendMessage({
          userId: 'demo-user',
          currentMessage: trimmed,
          conversationHistory,
          metadata: {
            channel: 'web',
            type: 'text',
          },
        })

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
    [isLoading, messages],
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    messages,
    isLoading,
    error,
    suggestions,
    showSuggestions,
    sendUserMessage,
    clearError,
  }
}
