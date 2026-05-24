# DOCKERIZACIÓN - Telegram Agent Integration

## Resumen

Proyecto completamente dockerizado para la integración entre la Bot API de Telegram y un Agente IA. Solo necesitas un comando para que todo funcione.

---

## Archivos Docker

```
Dockerfile               -> Imagen multi-stage (Node.js Alpine)
docker-compose.yml       -> Orquesta telegram-agent + agent-mock
.dockerignore            -> Optimización de imagen
```

---

## Cómo ejecutar (3 comandos)

### Paso 1: Instala Docker

Descarga desde https://www.docker.com/products/docker-desktop y abre Docker Desktop.

### Paso 2: Configura variables

```cmd
copy .env.example .env
```

Edita `.env` con tu `TELEGRAM_BOT_TOKEN` y `TELEGRAM_WEBHOOK_SECRET_TOKEN`.

### Paso 3: Ejecuta

```cmd
docker-compose up
```

Deberías ver:

```
telegram-agent-integration | 🚀 Servidor iniciado en puerto 3000
telegram-agent-mock        | 🤖 Agente IA Mock corriendo en puerto 3001
```

---

## Qué hace `docker-compose.yml`

```yaml
services:
  telegram-agent:
    # Servidor principal en puerto 3000
    # Imagen compilada desde Dockerfile
    # Variables de entorno desde .env
    # Volumen para logs
    # Healthcheck incluido
    # Reinicia automáticamente

  agent-mock:
    # Agente de prueba en puerto 3001
    # Inicia automáticamente
    # Conectado a telegram-agent vía red interna
```

---

## Arquitectura

```
+-----------------------------------------+
|         Docker Compose                  |
+-----------------------------------------+
| +----------------------------------+    |
| | telegram-agent (Node.js 18)      |    |
| | Puerto 3000                       |    |
| | - Recibe webhooks de Telegram   |    |
| | - Llama al agente IA            |    |
| | - Devuelve respuestas con sendMessage |
| +----------------------------------+    |
|                                          |
| +----------------------------------+    |
| | agent-mock (Node.js 18)          |    |
| | Puerto 3001                       |    |
| | - Procesa /chat                  |    |
| | - Devuelve respuestas mock       |    |
| +----------------------------------+    |
|                                          |
| Logs: ./logs                            |
| Red:  telegram-network                  |
+-----------------------------------------+
```

---

## Estructura del proyecto

```
telegram-integration/
├── DOCKER
│   ├── Dockerfile           -> Multi-stage build
│   ├── docker-compose.yml   -> Orquestación
│   └── .dockerignore        -> Optimización
│
├── DOCUMENTACIÓN
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── QUICK_START.md
│   └── .env.example
│
├── CONFIGURACIÓN
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
│
├── CÓDIGO FUENTE (src/)
│   ├── index.ts
│   ├── app.ts
│   ├── config/env.ts
│   ├── services/
│   │   ├── telegram/        -> Bot API client + webhook handler
│   │   ├── agent/           -> Cliente del agente
│   │   ├── conversation/    -> Gestor de contexto
│   │   └── orchestrator/    -> Orquestador
│   ├── routes/webhook.routes.ts
│   ├── types/               -> Interfaces TypeScript
│   ├── utils/               -> Logger + errores
│   └── middleware/          -> Validación
│
└── EJEMPLOS
    └── examples/agent-mock.js
```

---

## Comandos Docker útiles

```bash
# Iniciar
docker-compose up

# Iniciar en background
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio
docker-compose logs -f telegram-agent
docker-compose logs -f agent-mock

# Ver estado de contenedores
docker-compose ps

# Detener
docker-compose down

# Detener y limpiar volúmenes
docker-compose down -v

# Reconstruir imagen
docker-compose up --build

# Reconstruir sin caché
docker-compose up --build --no-cache

# Ejecutar comando en contenedor
docker-compose exec telegram-agent sh

# Ver uso de recursos
docker stats
```

---

## Seguridad

El `Dockerfile` incluye:
- Usuario no-root (`nodejs`)
- Multi-stage build (imagen final pequeña)
- Alpine Linux (ligero y seguro)
- Health check incluido
- Variables de entorno por `.env` (no se incluyen en la imagen)

Adicionalmente, el webhook valida la cabecera `X-Telegram-Bot-Api-Secret-Token` para asegurar que las peticiones provengan de Telegram.

---

## Tamaño de imagen

- **Etapa Build**: ~500 MB (descartada)
- **Etapa Runtime**: ~200 MB (final)

---

## Deployment a producción

### Railway.app (recomendado)

```bash
git add .
git commit -m "Add Telegram integration"
git push

# 1. Ve a https://railway.app/
# 2. Conecta tu repo
# 3. Railway detecta el Dockerfile automáticamente
# 4. Configura variables en Railway
# 5. Deploy
# 6. Copia la URL pública a TELEGRAM_WEBHOOK_URL y registra el webhook
```

### AWS, Google Cloud, Azure, Fly.io

Todos soportan Dockerfile estándar. Configura las mismas variables y haz `setWebhook` con la URL pública resultante.

---

## Checklist final

- [x] `Dockerfile` (multi-stage)
- [x] `docker-compose.yml`
- [x] `.dockerignore`
- [x] Documentación actualizada para Telegram
- [x] Validación con `secret_token`
- [x] Health check incluido
- [x] Listo para producción

---

## Próximos pasos

1. Instala Docker Desktop
2. Crea tu bot con [@BotFather](https://t.me/BotFather)
3. Copia `.env.example` a `.env` y configura las variables
4. `docker-compose up`
5. Expón el servidor con ngrok o Railway
6. Llama a `setWebhook` (o deja que el servidor lo haga al arrancar)
7. Habla con tu bot

---

## Verificación

```cmd
:: Health check local
curl http://localhost:3000/webhook/health

:: Estado del webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```
