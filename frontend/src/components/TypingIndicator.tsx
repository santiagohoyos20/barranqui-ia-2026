export function TypingIndicator() {
  return (
    <div className="message-row message-row--agent" aria-live="polite" aria-label="El asistente está escribiendo">
      <div className="message-row__avatar" aria-hidden="true">
        S
      </div>
      <div className="typing-indicator">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
