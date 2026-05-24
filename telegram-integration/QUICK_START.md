# Inicio Rápido - Docker (30 segundos)

## TL;DR - Solo ejecuta esto

```cmd
:: 1. Instala Docker (si no lo tienes)
:: https://www.docker.com/products/docker-desktop

:: 2. Copia configuración
copy .env.example .env

:: 3. Edita .env con tu TELEGRAM_BOT_TOKEN y TELEGRAM_WEBHOOK_SECRET_TOKEN

:: 4. Ejecuta
docker-compose up

:: 5. Listo. Accede a http://localhost:3000/webhook/health
```

---

## Crear el bot en 1 minuto

1. Abre Telegram y busca [@BotFather](https://t.me/BotFather)
2. Envía `/newbot`
3. Elige nombre y username (debe terminar en `bot`)
4. Copia el `TOKEN` que devuelve BotFather

---

## Archivos importantes

```
Dockerfile                  -> Imagen multi-stage optimizada
docker-compose.yml          -> Orquesta telegram-agent + agent-mock
.dockerignore               -> Archivos excluidos
.env.example                -> Variables disponibles
src/                        -> Código TypeScript
examples/agent-mock.js      -> Agente IA de prueba
```

---

## Opciones de Ejecución

### Opción 1: docker-compose (recomendado)

```cmd
docker-compose up
```

Inicia:
- Servidor Telegram en puerto 3000
- Agente Mock en puerto 3001
- Logs en tiempo real

### Opción 2: docker build + run

```cmd
docker build -t telegram-agent .

docker run -p 3000:3000 ^
  -e TELEGRAM_BOT_TOKEN=xxx ^
  -e TELEGRAM_WEBHOOK_SECRET_TOKEN=xxx ^
  -e TELEGRAM_WEBHOOK_URL=https://miapp.ngrok.io ^
  -e AGENT_API_URL=http://host.docker.internal:3001 ^
  telegram-agent
```

### Opción 3: Sin Docker (desarrollo)

```cmd
npm install
npm run dev
```

---

## Flujo de Datos

```
Usuario en Telegram
      |
      v
   Telegram (POST /webhook/telegram con X-Telegram-Bot-Api-Secret-Token)
      |
      v
   Validación + Parsing
      |
      v
   Conversation Manager (contexto en memoria)
      |
      v
   Agent Client (POST /chat al agente IA)
      |
      v
   Agente IA (procesa)
      |
      v
   Telegram Client (sendMessage)
      |
      v
   Usuario recibe respuesta
```

---

## Configuración Rápida

### Paso 1: Token del bot

Habla con [@BotFather](https://t.me/BotFather) y copia tu `TELEGRAM_BOT_TOKEN`.

### Paso 2: Archivo .env

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_WEBHOOK_SECRET_TOKEN=mi_token_secreto_aleatorio
TELEGRAM_WEBHOOK_URL=https://miapp.ngrok.io
TELEGRAM_WEBHOOK_PATH=/webhook/telegram
AGENT_API_URL=http://agent-mock:3001
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### Paso 3: Ejecuta Docker

```cmd
docker-compose up
```

### Paso 4: Registra el webhook

Si configuraste `TELEGRAM_WEBHOOK_URL`, el servidor lo registra solo. Si prefieres hacerlo manualmente:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://miapp.ngrok.io/webhook/telegram","secret_token":"mi_token_secreto_aleatorio"}'
```

---

## Verificación

```cmd
:: Health check
curl http://localhost:3000/webhook/health

:: Estado del webhook en Telegram
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

:: Logs
docker-compose logs -f
```

---

## Exponer a Internet

### ngrok (Desarrollo)

```cmd
ngrok http 3000
:: Copia la URL https://xxxxx-xxxx.ngrok.io a TELEGRAM_WEBHOOK_URL
```

### Railway (Producción)

1. https://railway.app/
2. Conecta tu repo de GitHub
3. Railway detecta el Dockerfile automáticamente
4. Configura variables de entorno
5. Deploy automático
6. Toma la URL pública y configúrala en `TELEGRAM_WEBHOOK_URL`

---

## Prueba

Envía a tu bot estos mensajes desde Telegram:
- `/start`
- "Hola"
- "¿Cuál es mi saldo?"
- "Transferencia"

Deberías recibir respuesta del agente mock.

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Port 3000 in use" | `set PORT=3001 && docker-compose up` |
| "Cannot connect to agent" | Verifica `AGENT_API_URL` en `.env` |
| 403 en webhook | Verifica `TELEGRAM_WEBHOOK_SECRET_TOKEN` |
| Bot no responde | Revisa `getWebhookInfo` y que la URL sea HTTPS pública |
| "Docker not running" | Abre Docker Desktop |

---

## Comandos Docker

```cmd
:: Ver contenedores
docker-compose ps

:: Ver logs
docker-compose logs -f

:: Detener
docker-compose down

:: Reconstruir
docker-compose up --build

:: Limpiar
docker-compose down -v
```
