# WhatsApp Agent Integration - Serfinanza

Integración entre la API de WhatsApp Business y un Agente de IA para Serfinanza. Este sistema permite que los usuarios envíen mensajes por WhatsApp, que son procesados por un agente de inteligencia artificial y devueltos como respuestas automáticas.

## Características

✅ **Recepción de mensajes de WhatsApp** - Integración con WhatsApp Business API oficial  
✅ **Procesamiento por Agente IA** - Envío de mensajes al agente para procesamiento  
✅ **Gestión de contexo** - Mantiene el historial de conversaciones en memoria  
✅ **Manejo de archivos** - Soporte para imágenes, documentos, audios y videos  
✅ **Reintentos automáticos** - Reintentos exponenciales para fallos de conexión  
✅ **Logging completo** - Sistema de logging con Winston  
✅ **Health checks** - Monitoreo de estado del sistema  
✅ **Estadísticas** - Endpoints para obtener estadísticas en tiempo real  

---

## Requisitos Previos

### Opción A: Docker (Recomendado) ⭐

- **Docker Desktop** v20.10+
- **docker-compose** v2.0+
- **Cuenta de WhatsApp Business** con acceso a la API

[Descargar Docker Desktop](https://www.docker.com/products/docker-desktop)

### Opción B: Local (Sin Docker)

- **Node.js** v16+
- **npm** o **yarn**
- **Cuenta de WhatsApp Business** con acceso a la API
- **Agente IA** implementado con endpoint HTTP

---

## Instalación

### Opción A: Con Docker (⭐ Recomendado)

**1. Copia configuración:**

```bash
cp .env.example .env
```

**2. Edita `.env` con tus credenciales:**

```env
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxx
WHATSAPP_WEBHOOK_TOKEN=tu_webhook_token
AGENT_API_URL=http://agent-mock:3001
PORT=3000
```

**3. Ejecuta:**

```bash
docker-compose up
```

✅ Inicia automáticamente:
- Servidor WhatsApp (puerto 3000)
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

## Ejecución

### Con Docker (Recomendado)

```bash
# Desarrollo con logs en tiempo real
docker-compose up

# Detener
docker-compose down

# Reconstruir imagen
docker-compose up --build
```

**Útiles:**

```bash
# Ver logs de un servicio
docker-compose logs -f whatsapp-agent

# Ver estadísticas
docker-compose ps

# Ejecutar comando dentro del contenedor
docker-compose exec whatsapp-agent bash
```

---

### Sin Docker (Local)

**Desarrollo:**

```bash
npm run dev
```

**Producción:**

```bash
npm run build
npm start
```

---

## API Endpoints

### Webhooks

#### `GET /webhook/messages`
Validación del webhook de WhatsApp (Meta)

**Parámetros de query:**
- `hub_verify_token` - Token configurado en `.env`
- `hub_challenge` - Challenge enviado por Meta

**Respuesta:**
```
200 OK: hub_challenge
```

#### `POST /webhook/messages`
Recibe mensajes de WhatsApp

**Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "34601234567",
                "id": "wamid.xxx",
                "timestamp": "1234567890",
                "type": "text",
                "text": { "body": "Hola" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Respuesta:**
```json
{ "received": true }
```

### Monitoreo

#### `GET /webhook/health`
Health check del sistema

**Respuesta:**
```json
{
  "status": "ok",
  "whatsapp": "connected",
  "agent": "connected",
  "conversationStats": {
    "activeSessions": 5,
    "totalMessages": 42,
    "sessions": [
      {
        "userId": "34601234567",
        "messageCount": 8,
        "lastActivity": "2026-05-23T10:30:45.123Z"
      }
    ]
  },
  "timestamp": "2026-05-23T10:35:20.456Z"
}
```

#### `GET /webhook/stats`
Estadísticas de conversaciones

**Respuesta:**
```json
{
  "conversationStats": {
    "activeSessions": 5,
    "totalMessages": 42,
    "sessions": [...]
  },
  "timestamp": "2026-05-23T10:35:20.456Z"
}
```

#### `GET /webhook/conversation/:userId`
Obtiene el historial de una conversación

**Parámetros:**
- `userId` - Número de teléfono del usuario

**Respuesta:**
```json
{
  "userId": "34601234567",
  "phone": "34601234567",
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
      "timestamp": 1234567895,
      "metadata": { "confidence": 0.95 }
    }
  ]
}
```

---

## Flujo de Funcionamiento

```
1. Usuario envía mensaje en WhatsApp
   ↓
2. Meta envía webhook POST a /webhook/messages
   ↓
3. Validación del webhook (token, estructura)
   ↓
4. Extracción de datos (userId, mensaje, tipo)
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
10. Se agrega respuesta al contexo
   ↓
11. WhatsApp Client envía respuesta al usuario
   ↓
12. Respuesta entregada ✓
```

---

## Estructura del Agente IA (Interfaz esperada)

Tu agente IA debe tener un endpoint `POST /chat` que acepte:

### Request

```json
{
  "userId": "34601234567",
  "currentMessage": "¿Cuál es mi saldo?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hola",
      "timestamp": 1234567890
    },
    {
      "role": "agent",
      "content": "Hola, soy el asistente de Serfinanza",
      "timestamp": 1234567895
    }
  ],
  "metadata": {
    "phone": "34601234567",
    "type": "text"
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

## Configuración de Webhook en Meta Dashboard

1. Ve a **App Dashboard** → **WhatsApp** → **Configuración**
2. En **Webhooks**, configura:
   - **URL**: `https://tudominio.com/webhook/messages`
   - **Token de Verificación**: El valor de `WHATSAPP_WEBHOOK_TOKEN` en `.env`
   - **Eventos para suscribirse**: `messages`, `message_status`

3. Haz clic en **Verificar y guardar**

---

## Gestor de Contexo (En Memoria)

El sistema mantiene el historial de conversaciones en memoria durante 24 horas:

- **Almacenamiento**: Map de JavaScript (userId → UserSession)
- **Timeout de inactividad**: 24 horas
- **Limpieza automática**: Cada hora
- **Máx. mensajes por sesión**: 100

**Para producción con múltiples servidores, considera usar Redis:**

```typescript
// Futura extensión para Redis
// import redis from 'redis';
// const redisClient = redis.createClient();
```

---

## Manejo de Errores y Reintentos

### Estrategia de reintentos para el Agente

- **Máximo de intentos**: 3
- **Delay inicial**: 1 segundo
- **Backoff exponencial**: 1s, 2s, 4s
- **Total máximo de tiempo**: ~7 segundos

### Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Token inválido | `WHATSAPP_WEBHOOK_TOKEN` incorrecto | Verifica el valor en `.env` |
| 401 Unauthorized | Token de acceso de WhatsApp expirado | Renueva el token en Meta |
| 404 Not Found | Agente no disponible | Verifica `AGENT_API_URL` |
| EADDRINUSE | Puerto ya en uso | Cambia `PORT` en `.env` |

---

## Logs

Los logs se guardan en:

- **error.log** - Solo errores
- **combined.log** - Todos los eventos

### Niveles de logging

- `error` - Errores críticos
- `warn` - Advertencias
- `info` - Información importante
- `debug` - Detalles de debugging
- `silly` - Información muy detallada

---

## Estructura de Carpetas

```
whatsapp-integration/
├── 🐳 Docker
│   ├── Dockerfile                       # Imagen multi-stage optimizada
│   ├── docker-compose.yml               # Orquestación de contenedores
│   └── .dockerignore                    # Archivos excluidos
│
├── ⚙️ Configuración
│   ├── package.json                     # Dependencias
│   ├── tsconfig.json                    # TypeScript config
│   ├── .env.example                     # Template de variables
│   └── .gitignore                       # Git ignore
│
├── 💻 Código Fuente (src/)
│   ├── index.ts                         # Punto de entrada
│   ├── app.ts                           # Configuración de Express
│   ├── config/
│   │   └── env.ts                       # Carga variables
│   ├── services/
│   │   ├── whatsapp/
│   │   │   ├── webhook.service.ts       # Procesa webhooks
│   │   │   └── client.service.ts        # Envía mensajes
│   │   ├── agent/
│   │   │   └── client.service.ts        # Cliente del agente
│   │   ├── conversation/
│   │   │   └── manager.service.ts       # Gestión de contexo
│   │   └── orchestrator/
│   │       └── message.orchestrator.ts  # Orquestador central
│   ├── routes/
│   │   └── webhook.routes.ts            # Rutas HTTP
│   ├── types/
│   │   ├── whatsapp.types.ts            # Tipos de WhatsApp
│   │   ├── agent.types.ts               # Tipos del agente
│   │   └── conversation.types.ts        # Tipos de contexo
│   ├── utils/
│   │   ├── logger.ts                    # Sistema de logging
│   │   └── errors.ts                    # Clases de error
│   └── middleware/
│       └── validation.middleware.ts     # Validación
│
├── 📚 Documentación
│   ├── README.md                        # Esta documentación
│   ├── GETTING_STARTED.md               # Guía paso a paso
│   └── QUICK_START.md                   # Inicio rápido
│
└── 🧪 Ejemplos
    └── examples/
        └── agent-mock.js                # Agente IA mock para pruebas
```

---

## Próximos Pasos

1. **Implementar el Agente IA**: Crea un endpoint `POST /chat` en tu agente
2. **Configurar variables de entorno**: Completa tu `.env` con credenciales reales
3. **Desplegar a un servidor público**: Usa ngrok (dev) o un servidor real (prod)
4. **Configurar webhook en Meta**: Vincula tu URL pública al dashboard
5. **Probar con mensajes reales**: Envía mensajes desde WhatsApp

---

## Deployment

### Con Docker (Recomendado) ⭐

#### Desarrollo Local

```bash
# Ejecutar con docker-compose
docker-compose up

# Logs en tiempo real
docker-compose logs -f

# Detener
docker-compose down
```

#### Producción (Railway.app)

Railway es la forma **más fácil** de desplegar Docker:

1. Ve a: https://railway.app/
2. Conecta tu repositorio GitHub
3. Railway detecta automáticamente el `Dockerfile`
4. Configura variables de entorno en Railway
5. Deploy automático en 1 click
6. Obtén URL pública para webhook Meta

**Otras opciones de Cloud:**
- Heroku: https://www.heroku.com/
- AWS: https://aws.amazon.com/
- DigitalOcean: https://www.digitalocean.com/

#### Explicación del Dockerfile

El proyecto incluye un `Dockerfile` multi-stage optimizado:

- **Stage 1 (Build)**: Compila TypeScript a JavaScript
- **Stage 2 (Runtime)**: Corre solo las dependencias necesarias
- **Ventajas**: Imagen pequeña, segura, rápida

```dockerfile
FROM node:18-alpine AS builder
# Compila TypeScript

FROM node:18-alpine
# Corre la app compilada
```

---

### Sin Docker (ngrok + Local)

```bash
# Terminal 1: Inicia ngrok
ngrok http 3000

# Terminal 2: Actualiza .env
AGENT_API_URL=http://localhost:3001

# Terminal 3: Inicia el servidor
npm run dev

# Usa la URL de ngrok en Meta Dashboard
# https://xxxxx-xx-xxx-xxx-xxx.ngrok.io/webhook/messages
```

---

## Contribución

Para contribuir, por favor:

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## Troubleshooting

### Problema: "Token de webhook inválido"
**Solución**: Verifica que `WHATSAPP_WEBHOOK_TOKEN` en `.env` coincida con el valor en Meta Dashboard.

### Problema: "Agente no disponible"
**Solución**: 
- Verifica que `AGENT_API_URL` es correcto
- En Docker: usa `http://agent-mock:3001`
- En local: usa `http://localhost:3001`
- Revisa logs: `docker-compose logs -f`

### Problema: "Docker daemon is not running"
**Solución**: Abre Docker Desktop

### Problema: "Puerto 3000 ya está en uso"
**Solución 1 (Docker)**: Cambia el puerto en `.env`:
```env
PORT=3001
docker-compose up
```

**Solución 2 (Local)**: Mata el proceso:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Problema: "Mensajes no se reciben"
**Solución**:
- Verifica que la URL del webhook es pública (no localhost)
- Comprueba que el token de webhook está correcto
- Revisa los logs: `docker-compose logs -f`
- Usa `curl http://localhost:3000/webhook/health` para verificar estado
- Verifica que la URL de webhook es correcta en Meta Dashboard

### Problema: "Cannot connect to agent"
**Solución**:
- Asegúrate de que `AGENT_API_URL` es correcto
- En docker-compose: debe ser `http://agent-mock:3001`
- Verifica que el servicio agent-mock está corriendo: `docker-compose ps`
- Revisa logs: `docker-compose logs agent-mock`

### Problema: "Reconstruir después de cambios"
```bash
# Reconstruir imagen
docker-compose up --build

# Reconstruir sin caché
docker-compose up --build --no-cache

# Limpiar todo
docker-compose down -v
```

---

## Licencia

ISC

---

## Contacto

Para preguntas o soporte: [tu email]

---

## Changelog

### v2.0.0 (2026-05-23)
- 🐳 **Docker**: Dockerfile multi-stage + docker-compose.yml
- ✨ Implementación inicial de la integración WhatsApp-Agente
- 📦 Estructura completa del proyecto
- 🔄 Sistema de reintentos exponenciales
- 📊 Gestión de contexo en memoria
- 🛡️ Validación de webhooks y seguridad
- 📝 Logging completo con Winston
- 🏥 Health checks y estadísticas
- 📚 Documentación completa (GETTING_STARTED, QUICK_START)
