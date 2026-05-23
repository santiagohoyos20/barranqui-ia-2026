export function ChatHeader() {
  return (
    <header className="chat-header">
      <div className="chat-header__avatar" aria-hidden="true">
        <span>S</span>
      </div>
      <div className="chat-header__info">
        <h1 className="chat-header__title">Asistente Serfinanza</h1>
        <p className="chat-header__status">
          <span className="chat-header__status-dot" />
          En línea · Respuestas con IA
        </p>
      </div>
    </header>
  )
}
