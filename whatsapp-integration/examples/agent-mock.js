/**
 * AGENTE IA MOCK PARA PRUEBAS
 * 
 * Este es un ejemplo de cómo debería implementarse un Agente IA
 * que sea compatible con esta integración de WhatsApp.
 * 
 * Para usar este mock:
 * 1. npm install express
 * 2. node examples/agent-mock.js
 * 3. En otro terminal: npm run dev
 * 4. Envía un mensaje por WhatsApp
 */

const express = require('express');

const app = express();
app.use(express.json());

/**
 * Endpoint: POST /chat
 * Recibe un mensaje y devuelve una respuesta
 */
app.post('/chat', (req, res) => {
  const { userId, currentMessage, conversationHistory, metadata } = req.body;

  console.log(`📨 Mensaje recibido de ${userId}: ${currentMessage}`);

  // Simular procesamiento del agente
  const response = {
    response: generarRespuesta(currentMessage, conversationHistory),
    confidence: Math.random() * (1 - 0.7) + 0.7, // Entre 0.7 y 1.0
    nextActions: ['transfer', 'more_info'],
  };

  console.log(`✅ Respuesta generada: ${response.response}`);
  res.json(response);
});

/**
 * Endpoint: GET /health
 * Verificar que el agente está disponible
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Agente disponible' });
});

/**
 * Endpoint: GET /info
 * Información del agente
 */
app.get('/info', (req, res) => {
  res.json({
    name: 'Serfinanza IA Agent (Mock)',
    version: '1.0.0',
    description: 'Mock agent para pruebas de integración WhatsApp',
  });
});

/**
 * Genera una respuesta basada en el mensaje del usuario
 */
function generarRespuesta(mensaje, conversationHistory) {
  const mensajeLower = mensaje.toLowerCase();

  // Respuestas de ejemplo
  if (mensajeLower.includes('hola') || mensajeLower.includes('hi')) {
    return '¡Hola! Soy el asistente de Serfinanza. ¿Cómo puedo ayudarte hoy?';
  }

  if (mensajeLower.includes('saldo')) {
    return 'Tu saldo actual es de $500,000 COP. ¿Hay algo más que pueda ayudarte?';
  }

  if (mensajeLower.includes('transferencia') || mensajeLower.includes('enviar')) {
    return 'Para realizar una transferencia, por favor proporciona el número de cuenta del destinatario y el monto.';
  }

  if (mensajeLower.includes('préstamo') || mensajeLower.includes('crédito')) {
    return 'Ofrecemos varios tipos de créditos. ¿Te gustaría conocer más sobre nuestros productos?';
  }

  if (mensajeLower.includes('gracias') || mensajeLower.includes('ok') || mensajeLower.includes('listo')) {
    return '¡De nada! Estoy aquí para ayudarte. ¿Hay algo más?';
  }

  // Respuesta genérica
  return `He recibido tu mensaje: "${mensaje}". Lamentablemente, no tengo información específica al respecto. Por favor, intenta con preguntas sobre saldo, transferencias o créditos.`;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🤖 Agente IA Mock corriendo en puerto ${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/chat`);
  console.log(`\n💡 Prueba estos mensajes:`);
  console.log('   - "Hola"');
  console.log('   - "¿Cuál es mi saldo?"');
  console.log('   - "Quiero hacer una transferencia"');
  console.log('   - "¿Qué créditos ofrecen?"\n');
});
