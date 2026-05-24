import { useChat } from '../hooks/useChat'
import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'

export function ChatPage() {
  const { messages, isLoading, error, suggestions, showSuggestions, sendUserMessage, clearError } =
    useChat()

  return (
    <div className="page page--chat">
      <header className="page-header page-header--compact">
        <div>
          <h1 className="page-header__title">Asistente Serfinanza</h1>
          <p className="page-header__subtitle">
            Escribe tu mensaje con tus palabras. Nosotros lo entendemos.
          </p>
        </div>
      </header>

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
        <ChatInput
          onSend={sendUserMessage}
          disabled={isLoading}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
        />
      </div>
    </div>
  )
}
