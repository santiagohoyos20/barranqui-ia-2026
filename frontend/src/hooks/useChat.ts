import { useCallback, useRef, useState } from 'react'
import { ChatApiError, sendMessage } from '../services/api'
import type { ChatMessage, ConversationEntry } from '../types/chat'

const USER_ID_KEY = 'serfinanza_user_id'

function getOrCreateUserId(): string {
  const stored = localStorage.getItem(USER_ID_KEY)
  if (stored) return stored

  const id = `web_${crypto.randomUUID()}`
  localStorage.setItem(USER_ID_KEY, id)
  return id
}

function createId(): string {
  return crypto.randomUUID()
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'agent',
  content:
    '¡Hola! Soy el asistente virtual de Serfinanza. Puedo ayudarte con información sobre tarjetas, créditos, horarios, canales de atención y más. ¿En qué puedo ayudarte hoy?',
  timestamp: Date.now(),
  status: 'sent',
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const userIdRef = useRef(getOrCreateUserId())

  const buildHistory = useCallback(
    (currentMessages: ChatMessage[]): ConversationEntry[] =>
      currentMessages
        .filter((m) => m.id !== 'welcome' && m.status !== 'error')
        .map(({ role, content, timestamp }) => ({ role, content, timestamp })),
    [],
  )

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
        const history = buildHistory([...messages, userMessage])

        const agentReply = await sendMessage({
          userId: userIdRef.current,
          currentMessage: trimmed,
          conversationHistory: history.slice(0, -1),
          metadata: { channel: 'web', type: 'text' },
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
    [buildHistory, isLoading, messages],
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
