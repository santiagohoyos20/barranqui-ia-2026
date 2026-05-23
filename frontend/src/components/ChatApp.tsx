import { useChat } from '../hooks/useChat'
import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'

export function ChatApp() {
  const { messages, isLoading, error, sendUserMessage, clearError } = useChat()

  return (
    <div className="chat-shell">
      <div className="chat-container">
        <ChatHeader />
        <MessageList messages={messages} isLoading={isLoading} />
        {error && (
          <div className="chat-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={clearError} aria-label="Cerrar error">
              ×
            </button>
          </div>
        )}
        <ChatInput onSend={sendUserMessage} disabled={isLoading} />
      </div>
    </div>
  )
}
