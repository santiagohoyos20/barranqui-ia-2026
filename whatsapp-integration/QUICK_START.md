# 🚀 Inicio Rápido - Docker (30 segundos)

## TL;DR - Solo ejecuta esto

```cmd
# 1. Instala Docker (si no lo tienes)
# https://www.docker.com/products/docker-desktop

# 2. Copia configuración
copy .env.example .env

# 3. Edita .env con tus credenciales de WhatsApp

# 4. Ejecuta
docker-compose up

# 5. ¡Listo! Accede a http://localhost:3000
```

---

## ✅ Archivos Creados (24 total)

### 📁 Docker
```
✅ Dockerfile               → Imagen multi-stage optimizada
✅ docker-compose.yml       → Orquestación fácil (recomendado)
✅ .dockerignore           → Archivos excluidos
```

### 📁 Configuración Base
```
✅ package.json            → Dependencias
✅ tsconfig.json           → TypeScript config
✅ .env.example            → Variables template
✅ .gitignore              → Git ignore
```

### 📁 Código Fuente (src/)
```
✅ index.ts                → Punto de entrada
✅ app.ts                  → Express setup
✅ config/env.ts           → Variables de entorno
✅ services/               → Lógica principal
  ├─ whatsapp/             → Integración WhatsApp
  ├─ agent/                → Cliente del Agente IA
  ├─ conversation/         → Gestor de contexto
  └─ orchestrator/         → Orquestador central
✅ routes/webhook.routes.ts → Endpoints HTTP
✅ types/                  → Interfaces TypeScript
✅ utils/                  → Logger y errores
✅ middleware/             → Validación
```

### 📁 Documentación
```
✅ README.md               → Docs completa
✅ GETTING_STARTED.md      → Guía detallada
✅ QUICK_START.md          → Esta guía
```

### 📁 Ejemplos
```
✅ examples/agent-mock.js  → Agente de prueba
```

---

## 🐳 Opciones de Ejecución

### Opción 1: docker-compose (⭐ Recomendado)

```cmd
docker-compose up
```

✅ Inicia todo automáticamente  
✅ Servidor WhatsApp + Agente Mock  
✅ Logs en tiempo real  
✅ Una línea

---

### Opción 2: docker build + run

```cmd
# Construir
docker build -t whatsapp-agent .

# Ejecutar
docker run -p 3000:3000 \
  -e WHATSAPP_PHONE_NUMBER_ID=xxx \
  -e WHATSAPP_BUSINESS_ACCOUNT_ID=xxx \
  -e WHATSAPP_ACCESS_TOKEN=xxx \
  -e WHATSAPP_WEBHOOK_TOKEN=xxx \
  whatsapp-agent
```

---

### Opción 3: Sin Docker (desarrollo)

Si quieres desarrollo local sin Docker:

```cmd
npm install
npm run dev
```

---

## 📊 Flujo de Datos

```
Usuario WhatsApp
       ↓
   Meta Webhook (POST /webhook/messages)
       ↓
   Validación + Parsing
       ↓
   Conversation Manager (contexto)
       ↓
   Agent IA Client (http://agent-mock:3001)
       ↓
   Agent IA Mock (procesa)
       ↓
   WhatsApp Client (envía respuesta)
       ↓
   Usuario recibe mensaje ✓
```

---

## 🔧 Configuración Rápida

### Paso 1: Credenciales WhatsApp

Ve a: https://developers.facebook.com/apps/

Copia estos valores:
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_ACCESS_TOKEN`

Define:
- `WHATSAPP_WEBHOOK_TOKEN` (cualquier valor)

### Paso 2: Archivo .env

```env
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxx
WHATSAPP_WEBHOOK_TOKEN=mi_token_secreto
AGENT_API_URL=http://agent-mock:3001
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### Paso 3: Ejecuta Docker

```cmd
docker-compose up
```

---

## ✅ Verificación

```cmd
# Health check
curl http://localhost:3000/webhook/health

# Ver estadísticas
curl http://localhost:3000/webhook/stats

# Ver logs
docker-compose logs -f
```

---

## 🌐 Exponer a Internet

### ngrok (Desarrollo)

```cmd
ngrok http 3000
# Copias URL: https://xxxxx-xxxx.ngrok.io
```

### Railway (Producción)

1. https://railway.app/
2. Conecta GitHub repo
3. Railway detecta Dockerfile
4. Deploy automático
5. Obtén URL pública

---

## 📱 Prueba

Envía a tu WhatsApp Business estos mensajes:
- "Hola"
- "¿Cuál es mi saldo?"
- "Transferencia"

Deberías recibir respuesta del agente mock.

---

## 🆘 Troubleshooting

| Error | Solución |
|-------|----------|
| "Port 3000 in use" | `PORT=3001 docker-compose up` |
| "Cannot connect to agent" | Verifica `AGENT_API_URL` en .env |
| "Token inválido" | Verifica `WHATSAPP_WEBHOOK_TOKEN` |
| "Docker not running" | Abre Docker Desktop |

---

## 📚 Documentos

| Archivo | Para |
|---------|------|
| GETTING_STARTED.md | Guía paso a paso |
| README.md | Documentación técnica |
| .env.example | Ver variables disponibles |

---

## 🐳 Comandos Docker

```cmd
# Ver contenedores
docker-compose ps

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Reconstruir
docker-compose up --build

# Limpiar (liberar espacio)
docker-compose down -v
```

---

## 🎯 Próximo Paso

```cmd
docker-compose up
```

Abre: http://localhost:3000/webhook/health

**¡Listo!** 🚀🐳
