# Guía de Inicio Rápido (Docker)

## Resumen de lo implementado

Esta es una **integración completa** entre la Bot API de Telegram y tu Agente IA. El sistema:

1. **Recibe mensajes** que los usuarios envían a tu bot de Telegram
2. **Envía al agente IA** con el contexto de la conversación
3. **Recibe la respuesta** del agente
4. **Devuelve el mensaje** al usuario por Telegram

Todo corre en Docker, no necesitas instalar Node.js localmente.

---

## Tareas de Setup (15 minutos)

### PASO 1: Instalar Docker Desktop

1. Descarga desde https://www.docker.com/products/docker-desktop
2. Instala y abre Docker Desktop
3. Verifica:
   ```cmd
   docker --version
   docker-compose --version
   ```

### PASO 2: Crear el bot de Telegram

1. Abre Telegram y habla con [@BotFather](https://t.me/BotFather)
2. Envía `/newbot`
3. Sigue los pasos (nombre + username terminado en `bot`)
4. Copia el **token** (formato `1234567890:ABC...`)

### PASO 3: Configurar variables de entorno

```cmd
copy .env.example .env
```

Edita `.env`:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_WEBHOOK_SECRET_TOKEN=elige_un_token_aleatorio
TELEGRAM_WEBHOOK_URL=
TELEGRAM_WEBHOOK_PATH=/webhook/telegram
AGENT_API_URL=http://agent-mock:3001
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

> El `TELEGRAM_WEBHOOK_SECRET_TOKEN` es un valor que tú eliges (1 a 256 caracteres `A-Z`, `a-z`, `0-9`, `_`, `-`).

---

## Ejecutar con Docker (3 comandos)

### Opción A: docker-compose (recomendado)

```cmd
docker-compose up
```

Esto inicia automáticamente:

- Servidor Telegram en puerto 3000
- Agente Mock en puerto 3001
- Logs en tiempo real

Deberías ver:

```
telegram-agent-integration | 🚀 Servidor iniciado en puerto 3000
telegram-agent-mock        | 🤖 Agente IA Mock corriendo en puerto 3001
```

Para detener:

```cmd
docker-compose down
```

### Opción B: docker build + run

```cmd
docker build -t telegram-agent:latest .

docker run -p 3000:3000 ^
  -e TELEGRAM_BOT_TOKEN=tu_token ^
  -e TELEGRAM_WEBHOOK_SECRET_TOKEN=tu_secret ^
  -e TELEGRAM_WEBHOOK_URL=https://miapp.ngrok.io ^
  -e AGENT_API_URL=http://host.docker.internal:3001 ^
  telegram-agent:latest
```

---

## Verificar que funciona

### Health Check

```cmd
curl http://localhost:3000/webhook/health
```

Deberías recibir:

```json
{
  "status": "ok",
  "telegram": "connected",
  "agent": "connected",
  "conversationStats": {...}
}
```

### Ver logs en tiempo real

```cmd
docker-compose logs -f
```

---

## Exponer a Internet (Necesario para Telegram)

Telegram requiere una URL **pública** con **HTTPS**.

### Opción 1: ngrok (desarrollo)

```cmd
ngrok http 3000
```

Verás algo como `Forwarding https://xxxxx-xxxx.ngrok.io -> http://localhost:3000`. Copia esa URL en `TELEGRAM_WEBHOOK_URL` y reinicia `docker-compose`.

### Opción 2: VPS / Cloud (producción)

**Railway.app** es muy fácil para proyectos con Docker:

1. Crea cuenta en https://railway.app/
2. Conecta tu repositorio GitHub
3. Railway detecta automáticamente el `Dockerfile`
4. Configura las variables de entorno
5. Deploy en 1 click
6. Copia la URL pública a `TELEGRAM_WEBHOOK_URL`

Otros: Heroku, AWS, DigitalOcean, Fly.io.

---

## Registrar el webhook en Telegram

### Opción A: automático

Si `TELEGRAM_WEBHOOK_URL` está configurada, el servidor llama a `setWebhook` al arrancar.

### Opción B: manual

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://miapp.ngrok.io/webhook/telegram",
    "secret_token": "elige_un_token_aleatorio",
    "allowed_updates": ["message", "edited_message"]
  }'
```

Verificar:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

Eliminar:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

---

## Probar el bot

1. Abre Telegram
2. Busca tu bot por su `@username`
3. Envíale `/start`
4. Prueba estos mensajes:
   - "Hola"
   - "¿Cuál es mi saldo?"
   - "Quiero hacer una transferencia"

Deberías recibir respuesta del agente mock.

---

## Conectar con TU Agente IA

Una vez que tengas tu agente real implementado, actualiza `.env`:

```env
AGENT_API_URL=http://tu-agente.com
```

Si tu agente corre en Docker en el mismo `docker-compose`:

```env
AGENT_API_URL=http://agent-service:3001
```

Tu agente debe responder en `POST /chat` con este formato:

**Request:**

```json
{
  "userId": "12345",
  "currentMessage": "Hola",
  "conversationHistory": [
    { "role": "user", "content": "...", "timestamp": 123456 }
  ],
  "metadata": { "chatId": 12345, "username": "juan" }
}
```

**Response:**

```json
{
  "response": "¡Hola! ¿Cómo estás?",
  "confidence": 0.95,
  "nextActions": []
}
```

---

## Documentación

- `README.md` - Documentación técnica completa
- `QUICK_START.md` - Resumen visual rápido
- `.env.example` - Variables disponibles
- `Dockerfile` - Configuración de imagen
- `docker-compose.yml` - Orquestación de contenedores

---

## Checklist antes de producción

- [ ] Docker Desktop instalado
- [ ] Bot creado con BotFather
- [ ] `.env` configurado con `TELEGRAM_BOT_TOKEN` y `TELEGRAM_WEBHOOK_SECRET_TOKEN`
- [ ] `docker-compose up` ejecutado exitosamente
- [ ] Health check responde OK
- [ ] URL pública (ngrok o cloud) configurada en `TELEGRAM_WEBHOOK_URL`
- [ ] Webhook registrado (`getWebhookInfo` muestra la URL correcta y `last_error_message: null`)
- [ ] Mensaje de prueba enviado al bot y respondido
- [ ] Logs revisados (sin errores)
- [ ] Agente IA real conectado

---

## Troubleshooting

### "Docker daemon is not running"

Abre Docker Desktop.

### "Port 3000 already in use"

```cmd
:: Ver qué usa el puerto
netstat -ano | findstr :3000

:: O cambia el puerto en .env
set PORT=3001
docker-compose up
```

### "Cannot connect to agent"

Verifica que `AGENT_API_URL` sea correcto.
- Para docker-compose: `http://agent-mock:3001`
- Para local: `http://localhost:3001`

### El bot no responde

```cmd
:: Ver logs
docker-compose logs -f

:: Ver estado del webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

:: Probar local
curl http://localhost:3000/webhook/health
```

Causas frecuentes:
- La URL de webhook no es HTTPS pública
- El `secret_token` no coincide → 403 en logs
- El bot no tiene mensajes nuevos (Telegram solo envía updates desde el momento del `setWebhook`)

### Reconstruir imagen

```cmd
docker-compose up --build
docker-compose up --build --no-cache
```

---

## Comandos Docker útiles

```cmd
docker-compose ps
docker-compose logs telegram-agent
docker-compose logs -f
docker-compose exec telegram-agent sh
docker-compose down
docker-compose down -v
docker-compose up --build
```

---

## Próximos pasos

1. Instala Docker Desktop
2. Crea tu bot con BotFather y copia el token
3. Copia `.env.example` a `.env` y completa los valores
4. `docker-compose up`
5. Levanta una URL pública (ngrok / Railway)
6. Actualiza `TELEGRAM_WEBHOOK_URL` y registra el webhook
7. Envía un mensaje de prueba a tu bot
