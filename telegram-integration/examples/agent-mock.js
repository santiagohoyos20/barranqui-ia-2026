/**
 * AGENTE IA MOCK PARA PRUEBAS
 *
 * Este es un ejemplo de cómo debería implementarse un Agente IA
 * que sea compatible con esta integración de Telegram.
 *
 * Para usar este mock:
 * 1. cd examples && npm install express
 * 2. node agent-mock.js
 * 3. En otro terminal: npm run dev (en la raíz del proyecto)
 * 4. Envía un mensaje a tu bot de Telegram
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
  if (metadata) {
    console.log(`   metadata:`, metadata);
  }

  const response = {
    response: generarRespuesta(currentMessage, conversationHistory),
    confidence: Math.random() * (1 - 0.7) + 0.7,
    nextActions: ['transfer', 'more_info'],
  };

  console.log(`✅ Respuesta generada: ${response.response}`);
  res.json(response);
});

/**
 * Endpoint: GET /health
 * Verificar que el agente está disponible
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Agente disponible' });
});

/**
 * Endpoint: GET /info
 * Información del agente
 */
app.get('/info', (_req, res) => {
  res.json({
    name: 'Serfinanza IA Agent (Mock)',
    version: '1.0.0',
    description: 'Mock agent para pruebas de integración Telegram',
  });
});

function generarRespuesta(mensaje, _conversationHistory) {
  const mensajeLower = (mensaje || '').toLowerCase();

  if (mensajeLower.includes('hola') || mensajeLower.includes('hi') || mensajeLower.includes('/start')) {
    return '¡Hola! Soy Sol, tu asesora virtual de Serfinanza. ¿Cómo puedo ayudarte hoy?';
  }

  if (mensajeLower.includes('saldo')) {
    return 'Tu saldo actual es de $500,000 COP. ¿Hay algo más que pueda ayudarte?';
  }

  if (mensajeLower.includes('transferencia') || mensajeLower.includes('enviar')) {
    return 'Para realizar una transferencia, por favor proporciona el número de cuenta del destinatario y el monto.';
  }

  if (mensajeLower.includes('préstamo') || mensajeLower.includes('credito') || mensajeLower.includes('crédito')) {
    return 'Ofrecemos varios tipos de créditos. ¿Te gustaría conocer más sobre nuestros productos?';
  }

  if (mensajeLower.includes('gracias') || mensajeLower.includes('ok') || mensajeLower.includes('listo')) {
    return '¡De nada! Estoy aquí para ayudarte. ¿Hay algo más?';
  }

  return `He recibido tu mensaje: "${mensaje}". Lamentablemente, no tengo información específica al respecto. Por favor, intenta con preguntas sobre saldo, transferencias o créditos.`;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🤖 Agente IA Mock corriendo en puerto ${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/chat`);
  console.log(`\n💡 Prueba estos mensajes desde Telegram:`);
  console.log('   - "/start" o "Hola"');
  console.log('   - "¿Cuál es mi saldo?"');
  console.log('   - "Quiero hacer una transferencia"');
  console.log('   - "¿Qué créditos ofrecen?"\n');
});
