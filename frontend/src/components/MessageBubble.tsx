import type { ChatMessage } from '../types/chat'

interface MessageBubbleProps {
  message: ChatMessage
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`message-row ${isUser ? 'message-row--user' : 'message-row--agent'}`}
    >
      {!isUser && (
        <div className="message-row__avatar" aria-hidden="true">
          S
        </div>
      )}
      <div
        className={`message-bubble ${isUser ? 'message-bubble--user' : 'message-bubble--agent'}`}
      >
        <p className="message-bubble__text">{message.content}</p>
        <div className="message-bubble__meta">
          <time dateTime={new Date(message.timestamp).toISOString()}>
            {formatTime(message.timestamp)}
          </time>
          {isUser && message.status === 'sending' && (
            <span className="message-bubble__status" aria-label="Enviando">
              ···
            </span>
          )}
          {isUser && message.status === 'error' && (
            <span className="message-bubble__status message-bubble__status--error">
              Error
            </span>
          )}
        </div>
        {!isUser && message.intent && (
          <span className="message-bubble__intent">{message.intent.replace(/_/g, ' ')}</span>
        )}
      </div>
    </div>
  )
}
