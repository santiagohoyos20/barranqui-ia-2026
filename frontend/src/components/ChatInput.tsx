import { useState, type FormEvent, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
  suggestions?: string[]
  showSuggestions?: boolean
}

export function ChatInput({
  onSend,
  disabled,
  suggestions = [],
  showSuggestions = false,
}: ChatInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSend(text)
    setText('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (disabled) return
    onSend(suggestion)
  }

  return (
    <div className="chat-input-area">
      {showSuggestions && suggestions.length > 0 ? (
        <div className="chat-suggestions" role="group" aria-label="Sugerencias de preguntas">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chat-suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={disabled}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <form className="chat-input" onSubmit={handleSubmit}>
        <textarea
          className="chat-input__field"
          placeholder="Escribe aquí, con tus palabras..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          aria-label="Mensaje"
        />
        <button
          type="submit"
          className="chat-input__send"
          disabled={disabled || !text.trim()}
          aria-label="Enviar mensaje"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  )
}
