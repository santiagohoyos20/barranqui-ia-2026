# Telegram Agent Integration - Serfinanza

Integración entre la API de bots de Telegram y un Agente de IA para Serfinanza. Este sistema permite que los usuarios envíen mensajes a un bot de Telegram, sean procesados por un agente de inteligencia artificial y reciban respuestas automáticas.

## Características

- **Recepción de mensajes de Telegram** - Integración con la Bot API oficial de Telegram (modo webhook)
- **Procesamiento por Agente IA** - Envío de mensajes al agente para procesamiento
- **Gestión de contexto** - Mantiene el historial de conversaciones en memoria
- **Manejo de archivos** - Soporte para imágenes, documentos, audio, notas de voz y videos
- **Reintentos automáticos** - Reintentos exponenciales para fallos al llamar al agente
- **Logging completo** - Sistema de logging con Winston
- **Health checks** - Monitoreo de estado del sistema
- **Estadísticas** - Endpoints para obtener estadísticas en tiempo real
- **Validación de webhook** - Soporte para `secret_token` (`X-Telegram-Bot-Api-Secret-Token`)

---

## Requisitos Previos

### Opción A: Docker (Recomendado)

- **Docker Desktop** v20.10+
- **docker-compose** v2.0+
- **Bot de Telegram** creado con [@BotFather](https://t.me/BotFather)

### Opción B: Local (Sin Docker)

- **Node.js** v16+
- **npm** o **yarn**
- **Bot de Telegram** creado con [@BotFather](https://t.me/BotFather)
- **Agente IA** implementado con endpoint HTTP

---

## Crear un bot de Telegram

1. Abre Telegram y busca [@BotFather](https://t.me/BotFather).
2. Envía `/newbot` y sigue las instrucciones (nombre y username terminados en `bot`).
3. Copia el **token** que te entrega BotFather (formato `1234567890:ABC...`).
4. Define un `TELEGRAM_WEBHOOK_SECRET_TOKEN` (cualquier cadena aleatoria de 1 a 256 caracteres `A-Z`, `a-z`, `0-9`, `_`, `-`).

---

## Instalación

### Opción A: Con Docker (Recomendado)

**1. Copia configuración:**

```bash
cp .env.example .env
```

**2. Edita `.env` con tus credenciales:**

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_WEBHOOK_SECRET_TOKEN=mi_token_aleatorio_secreto
TELEGRAM_WEBHOOK_URL=https://miapp.ngrok.io
TELEGRAM_WEBHOOK_PATH=/webhook/telegram
AGENT_API_URL=http://agent-mock:3001
PORT=3000
```

**3. Ejecuta:**

```bash
docker-compose up
```

Inicia automáticamente:

- Servidor Telegram (puerto 3000)
- Agente Mock (puerto 3001)
- Logs en tiempo real

---

### Opción B: Sin Docker (Desarrollo Local)

**1. Instala dependencias:**

```bash
npm install
```

**2. Copia y edita configuración:**

```bash
cp .env.example .env
# Edita .env con tus credenciales
```

**3. Inicia en desarrollo:**

```bash
npm run dev
```

---

## Registrar el webhook en Telegram

Telegram necesita saber a qué URL pública (HTTPS) enviar los mensajes. Puedes hacerlo de dos formas:

### Opción 1: Automático al arrancar

Si configuras `TELEGRAM_WEBHOOK_URL` en `.env`, el servidor registra el webhook al arrancar usando `setWebhook` con tu `secret_token`.

### Opción 2: Manual (recomendado para depurar)

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://miapp.ngrok.io/webhook/telegram",
    "secret_token": "mi_token_aleatorio_secreto",
    "allowed_updates": ["message", "edited_message"]
  }'
```

Para verificar:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

Para borrar:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

---

## Ejecución

### Con Docker

```bash
# Desarrollo con logs en tiempo real
docker-compose up

# Detener
docker-compose down

# Reconstruir imagen
docker-compose up --build
```

### Sin Docker

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

---

## API Endpoints

### Webhook

#### `POST /webhook/telegram`

Recibe Updates desde Telegram. Telegram debe enviar la cabecera `X-Telegram-Bot-Api-Secret-Token` con el valor de `TELEGRAM_WEBHOOK_SECRET_TOKEN`.

**Body (ejemplo de Update):**

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 42,
    "from": {
      "id": 12345,
      "is_bot": false,
      "first_name": "Juan",
      "username": "juan"
    },
    "chat": { "id": 12345, "type": "private" },
    "date": 1701000000,
    "text": "Hola"
  }
}
```

**Respuesta:**

```json
{ "ok": true }
```

### Monitoreo

#### `GET /webhook/health`

Health check del sistema.

```json
{
  "status": "ok",
  "telegram": "connected",
  "agent": "connected",
  "conversationStats": {
    "activeSessions": 5,
    "totalMessages": 42,
    "sessions": [
      {
        "userId": "12345",
        "chatId": 12345,
        "messageCount": 8,
        "lastActivity": "2026-05-23T10:30:45.123Z"
      }
    ]
  },
  "timestamp": "2026-05-23T10:35:20.456Z"
}
```

#### `GET /webhook/stats`

Estadísticas de conversaciones.

#### `GET /webhook/conversation/:userId`

Obtiene el historial de una conversación. `userId` es el `from.id` numérico de Telegram (como string).

```json
{
  "userId": "12345",
  "chatId": 12345,
  "messageCount": 8,
  "messages": [
    {
      "role": "user",
      "content": "¿Cuál es mi saldo?",
      "timestamp": 1234567890,
      "metadata": { "type": "text" }
    },
    {
      "role": "agent",
      "content": "Tu saldo es $500,000 COP",
      "timestamp": 1234567895
    }
  ]
}
```

---

## Flujo de Funcionamiento

```
1. Usuario envía mensaje al bot en Telegram
   ↓
2. Telegram envía un POST a /webhook/telegram
   ↓
3. Validación del secret_token y del Update
   ↓
4. Extracción de datos (userId, chatId, contenido)
   ↓
5. Conversation Manager obtiene o crea sesión
   ↓
6. Se agrega el mensaje a la conversación
   ↓
7. Se construye solicitud para el Agente IA
   ↓
8. Agent Client envía solicitud con reintentos
   ↓
9. Agente IA procesa y responde
   ↓
10. Se agrega respuesta al contexto
    ↓
11. Telegram Client envía respuesta al usuario (sendMessage)
    ↓
12. Respuesta entregada
```

---

## Estructura del Agente IA (Interfaz esperada)

Tu agente IA debe tener un endpoint `POST /chat` que acepte:

### Request

```json
{
  "userId": "12345",
  "currentMessage": "¿Cuál es mi saldo?",
  "conversationHistory": [
    { "role": "user", "content": "Hola", "timestamp": 1234567890 },
    { "role": "agent", "content": "Hola, soy el asistente", "timestamp": 1234567895 }
  ],
  "metadata": {
    "chatId": 12345,
    "username": "juan",
    "name": "Juan Pérez"
  }
}
```

### Response

```json
{
  "response": "Tu saldo actual es $500,000 COP",
  "confidence": 0.95,
  "nextActions": ["transfer", "more_info"]
}
```

---

## Gestor de Contexto (En Memoria)

El sistema mantiene el historial de conversaciones en memoria durante 24 horas:

- **Almacenamiento**: Map en memoria (`userId` → `UserSession`)
- **Timeout de inactividad**: 24 horas
- **Limpieza automática**: Cada hora
- **Máx. mensajes por sesión**: 100

Para producción con múltiples instancias, considera persistir las sesiones en Redis o una base de datos.

---

## Manejo de Errores y Reintentos

### Estrategia de reintentos para el Agente

- **Máximo de intentos**: 3
- **Delay inicial**: 1 segundo
- **Backoff exponencial**: 1s, 2s, 4s

### Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 403 Forbidden en webhook | `secret_token` incorrecto | Verifica `TELEGRAM_WEBHOOK_SECRET_TOKEN` y vuelve a llamar `setWebhook` |
| 401 Unauthorized | `TELEGRAM_BOT_TOKEN` inválido o revocado | Revisa el token con BotFather |
| Webhook no recibe nada | URL no es HTTPS o no es pública | Usa ngrok / un dominio HTTPS válido |
| 404 Not Found al agente | Agente no disponible | Verifica `AGENT_API_URL` |
| EADDRINUSE | Puerto ya en uso | Cambia `PORT` en `.env` |

---

## Logs

Los logs se guardan en:

- **error.log** - Solo errores
- **combined.log** - Todos los eventos

### Niveles de logging

- `error` / `warn` / `info` / `http` / `debug` / `silly`

---

## Estructura de Carpetas

```
telegram-integration/
├── Docker
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── Configuración
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .gitignore
│
├── Código fuente (src/)
│   ├── index.ts                              # Punto de entrada
│   ├── app.ts                                # Configuración de Express
│   ├── config/
│   │   └── env.ts                            # Variables de entorno
│   ├── services/
│   │   ├── telegram/
│   │   │   ├── webhook.service.ts            # Procesa Updates
│   │   │   └── client.service.ts             # Llama a la Bot API
│   │   ├── agent/
│   │   │   └── client.service.ts             # Cliente del agente
│   │   ├── conversation/
│   │   │   └── manager.service.ts            # Gestión de contexto
│   │   └── orchestrator/
│   │       └── message.orchestrator.ts       # Orquestador central
│   ├── routes/
│   │   └── webhook.routes.ts                 # Rutas HTTP
│   ├── types/
│   │   ├── telegram.types.ts                 # Tipos de Telegram
│   │   ├── agent.types.ts                    # Tipos del agente
│   │   └── conversation.types.ts             # Tipos de contexto
│   ├── utils/
│   │   ├── logger.ts                         # Sistema de logging
│   │   └── errors.ts                         # Clases de error
│   └── middleware/
│       └── validation.middleware.ts          # Validación
│
├── Documentación
│   ├── README.md                             # Esta documentación
│   ├── GETTING_STARTED.md                    # Guía paso a paso
│   └── QUICK_START.md                        # Inicio rápido
│
└── Ejemplos
    └── examples/
        └── agent-mock.js                     # Agente IA mock para pruebas
```

---

## Próximos Pasos

1. Crea tu bot con [@BotFather](https://t.me/BotFather) y copia el token
2. Implementa tu Agente IA con un endpoint `POST /chat`
3. Configura `.env` con tus credenciales
4. Despliega a una URL pública con HTTPS (ngrok en dev, Railway/AWS/etc. en prod)
5. Registra el webhook con `setWebhook`
6. Envía mensajes a tu bot

---

## Deployment

### Con Docker (Recomendado)

#### Producción (Railway.app)

1. Ve a https://railway.app/
2. Conecta tu repositorio GitHub
3. Railway detecta automáticamente el `Dockerfile`
4. Configura las variables de entorno en Railway
5. Deploy automático
6. Copia la URL pública y úsala en `TELEGRAM_WEBHOOK_URL` (o llama `setWebhook` manualmente)

Otras opciones: Heroku, AWS, DigitalOcean, Fly.io.

### Sin Docker (ngrok + Local)

```bash
# Terminal 1: Inicia ngrok
ngrok http 3000

# Terminal 2: Actualiza .env con la URL pública
TELEGRAM_WEBHOOK_URL=https://xxxx.ngrok.io
AGENT_API_URL=http://localhost:3001

# Terminal 3: Inicia el agente mock
node examples/agent-mock.js

# Terminal 4: Inicia el servidor
npm run dev
```

---

## Troubleshooting

### "Secret token de Telegram inválido" / 403 en webhook

- Verifica que `TELEGRAM_WEBHOOK_SECRET_TOKEN` en `.env` coincida con el `secret_token` enviado a `setWebhook`.
- Si los cambias, vuelve a llamar `setWebhook`.

### El bot no responde

- Comprueba `getWebhookInfo`: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`
- Revisa que `last_error_message` sea `null`.
- Verifica que la URL sea pública y use HTTPS.

### "Agente no disponible"

- Verifica que `AGENT_API_URL` es correcto
- En Docker: usa `http://agent-mock:3001`
- En local: usa `http://localhost:3001`

### Puerto 3000 en uso

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

---

## Licencia

ISC

---

## Changelog

### v2.0.0 (2026-05-23)
- Migración completa de WhatsApp Business API a Telegram Bot API
- Webhook con validación de `secret_token`
- Soporte para mensajes de texto, fotos, documentos, audio, notas de voz y videos
- Registro automático del webhook al arrancar (opcional)
