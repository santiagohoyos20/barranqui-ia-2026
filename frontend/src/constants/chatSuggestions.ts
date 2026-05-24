export const CHAT_SUGGESTIONS: readonly string[] = [
  'Gasté 85 mil en mercado hoy',
  '¿Cuáles son los horarios de atención?',
  'Recibí mi salario de 3 millones',
  '¿Requisitos del crédito de vivienda?',
  '¿Cómo activo mi tarjeta Mastercard?',
  'Quiero un crédito de libre inversión',
  '¿Qué tasas tienen los CDT?',
  '¿Qué seguros ofrece Serfinanza?',
  'Quiero unificar mis deudas',
  '¿Cómo solicito crédito de vehículo?',
  '¿Qué es crédito de libranza?',
  '¿Cómo funciona Crediplazos?',
  '¿Qué es el crédito rotativo?',
  '¿Cómo abro una cuenta de ahorros?',
  '¿Qué puedo hacer en Serfinanza Móvil?',
  '¿Cómo uso Serfinanza Virtual?',
  '¿Cómo pago con PSE?',
  'Gasté 120 mil en transporte esta semana',
  '¿Puedo agendar cita con un asesor?',
  'Quiero precalificarme para un crédito',
  '¿Dónde consulto tasas y tarifas?',
  '¿Beneficios de la tarjeta Olímpica Gold?',
  '¿Requisitos tarjeta Combarranquilla?',
  '¿Tarjeta de crédito empresarial?',
  '¿Crédito de capital de trabajo?',
  '¿Documentos para solicitar un crédito?',
  '¿Tips de seguridad bancaria?',
  'No reconozco un movimiento en mi tarjeta',
  '¿Cómo leo el extracto de mi tarjeta?',
  '¿Por qué no avanzó mi solicitud?',
  '¿Opciones de crédito educativo?',
  'Quiero invertir en un CDT',
  '¿Pagos PSE para mi empresa?',
  '¿Dónde hay oficinas de Serfinanza?',
  'Gasté 45 mil en servicios públicos',
  '¿Compra de cartera, cómo funciona?',
  '¿Cómo activo Crediplazos en la app?',
  '¿Cuánto tarda la aprobación de un crédito?',
  '¿Cómo bloqueo mi tarjeta desde la app?',
  '¿Qué productos puedo solicitar en línea?',
] as const

export function pickRandomChatSuggestions(count = 3): string[] {
  const pool = [...CHAT_SUGGESTIONS]

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, count)
}
