# 🚀 Guía de Inicio Rápido (Docker)

## Resumen de lo implementado

He creado una **integración completa** entre WhatsApp Business API y tu Agente IA. El sistema:

1. **Recibe mensajes** que los usuarios envían por WhatsApp
2. **Envía al agente IA** con el contexo de la conversación
3. **Recibe la respuesta** del agente
4. **Devuelve el mensaje** al usuario por WhatsApp

**Ahora todo corre en Docker** 🐳 - No necesitas instalar Node.js localmente.

---

## ✅ Tareas de Setup (15 minutos con Docker)

### PASO 1: Instalar Docker Desktop

1. Descarga desde: https://www.docker.com/products/docker-desktop (Windows)
2. Instala y abre Docker Desktop
3. Verifica en **CMD/PowerShell**:
   ```cmd
   docker --version
   docker-compose --version
   ```

### PASO 2: Configurar variables de entorno

1. En la carpeta del proyecto, copia `.env.example` a `.env`:
   ```cmd
   copy .env.example .env
   ```

2. Edita el archivo `.env` y completa con tus credenciales de WhatsApp:

```env
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_account_id
WHATSAPP_ACCESS_TOKEN=tu_token_acceso
WHATSAPP_WEBHOOK_TOKEN=tu_token_webhook_personalizado
AGENT_API_URL=http://agent-mock:3001
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### PASO 3: Obtener credenciales de WhatsApp

1. Ve a: https://developers.facebook.com/apps/
2. Selecciona tu app → WhatsApp
3. En **Configuración → Números de teléfono**:
   - Copia `WHATSAPP_PHONE_NUMBER_ID`
   - Copia `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - Genera/copia `WHATSAPP_ACCESS_TOKEN`
   - Define tu `WHATSAPP_WEBHOOK_TOKEN` (cualquier valor)

---

## 🏃 Ejecutar con Docker (3 comandos)

### Opción A: docker-compose (Recomendado) ⭐

**Una sola línea para todo:**

```cmd
docker-compose up
```

Esto inicia automáticamente:
- ✅ Servidor WhatsApp en puerto 3000
- ✅ Agente Mock en puerto 3001
- ✅ Logs en tiempo real

**Deberías ver:**
```
whatsapp-agent-integration | 🚀 Servidor iniciado en puerto 3000
whatsapp-agent-mock        | 🤖 Agente IA Mock corriendo en puerto 3001
```

**Para detener:**
```cmd
docker-compose down
```

---

### Opción B: docker build + run (Manual)

**Paso 1: Construir imagen**
```cmd
docker build -t whatsapp-agent:latest .
```

**Paso 2: Ejecutar contenedor**
```cmd
docker run -p 3000:3000 ^
  -e WHATSAPP_PHONE_NUMBER_ID=tu_phone_id ^
  -e WHATSAPP_BUSINESS_ACCOUNT_ID=tu_account_id ^
  -e WHATSAPP_ACCESS_TOKEN=tu_token ^
  -e WHATSAPP_WEBHOOK_TOKEN=tu_webhook_token ^
  -e AGENT_API_URL=http://host.docker.internal:3001 ^
  whatsapp-agent:latest
```

---

## 📊 Verificar que funciona

### Health Check

```cmd
curl http://localhost:3000/webhook/health
```

**Deberías recibir:**
```json
{
  "status": "ok",
  "whatsapp": "connected",
  "agent": "connected",
  "conversationStats": {...}
}
```

### Ver estadísticas

```cmd
curl http://localhost:3000/webhook/stats
```

### Ver logs en tiempo real

```cmd
docker-compose logs -f
```

---

## 🌐 Desplegar a Internet (Necesario para WhatsApp)

WhatsApp necesita una URL **pública**, no localhost.

### Opción 1: ngrok + Docker (Fácil, desarrollo)

1. Descarga ngrok: https://ngrok.com/download

2. En PowerShell/CMD:
   ```cmd
   ngrok http 3000
   ```

3. Verás: `Forwarding https://xxxxx-xxxx.ngrok.io -> http://localhost:3000`

---

### Opción 2: VPS/Cloud + Docker (Producción)

**Railway.app** (muy recomendado para Docker):

1. Crea cuenta en: https://railway.app/
2. Conecta tu repositorio GitHub
3. Railway detecta automáticamente el `Dockerfile`
4. Deploy en 1 click
5. Obtén tu URL pública

**Otros servicios:**
- Heroku: https://www.heroku.com/
- AWS: https://aws.amazon.com/
- DigitalOcean: https://www.digitalocean.com/

---

## ⚙️ Configurar Webhook en Meta

1. Ve a: https://developers.facebook.com/apps/
2. Selecciona tu app → WhatsApp → Configuración
3. En **Webhooks**, configura:
   - **Webhook URL**: `https://xxxxx-xxxx.ngrok.io/webhook/messages`
   - **Token de Verificación**: El valor de `WHATSAPP_WEBHOOK_TOKEN`
   - **Eventos**: marca `messages`

4. Haz clic en **"Verificar y guardar"**

---

## 📱 Enviar un mensaje de prueba

1. Envía un mensaje a tu número de WhatsApp Business desde WhatsApp
2. Deberías recibir una respuesta automática del agente mock

**Prueba estos mensajes:**
- "Hola"
- "¿Cuál es mi saldo?"
- "Quiero hacer una transferencia"

---

## 🔧 Conectar con TU Agente IA

Una vez que tengas implementado tu agente, actualiza en `.env`:

```env
AGENT_API_URL=http://tu-agente.com
```

**Si tu agente corre en Docker también:**
```env
AGENT_API_URL=http://agent-service:3001
```

Tu agente debe responder en `POST /chat` con este formato:

**Request:**
```json
{
  "userId": "34601234567",
  "currentMessage": "¿Hola?",
  "conversationHistory": [
    { "role": "user", "content": "...", "timestamp": 123456 }
  ],
  "metadata": { "phone": "34601234567" }
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

## 📚 Documentación

- `README.md` - Documentación técnica completa
- `QUICK_START.md` - Resumen visual
- `.env.example` - Variables disponibles
- `Dockerfile` - Configuración de imagen
- `docker-compose.yml` - Orquestación de contenedores
- `src/` - Código comentado

---

## 📦 Archivos Docker

```
Dockerfile              → Define cómo se construye la imagen
docker-compose.yml      → Orquesta múltiples contenedores
.dockerignore          → Archivos que excluir de la imagen
```

---

## ✅ Checklist antes de producción

- [ ] Docker Desktop instalado
- [ ] `.env` configurado con credenciales
- [ ] `docker-compose up` ejecutado exitosamente
- [ ] Health check responde OK
- [ ] ngrok o VPS configurado
- [ ] Webhook verificado en Meta
- [ ] Mensaje de prueba recibido
- [ ] Logs revisados (no errores)
- [ ] Agente IA conectado

---

## 🆘 Si algo falla

### Error: "Docker daemon is not running"
- Abre Docker Desktop

### Error: "Port 3000 already in use"
```cmd
# Ver qué usa el puerto
netstat -ano | findstr :3000

# O cambiar puerto en .env
PORT=3001
docker-compose up
```

### Error: "Cannot connect to agent"
- Verifica que `AGENT_API_URL` en `.env` es correcto
- Para docker-compose: `http://agent-mock:3001`
- Para ngrok: `http://localhost:3001` (antes de exponer)

### Los mensajes no llegan
```cmd
# Ver logs
docker-compose logs -f

# Verificar health
curl http://localhost:3000/webhook/health
```

### Reconstruir imagen (si cambias código)
```cmd
docker-compose up --build
```

---

## 🐳 Comandos Docker Útiles

```cmd
# Ver contenedores corriendo
docker-compose ps

# Ver logs de un servicio
docker-compose logs whatsapp-agent

# Ver logs en tiempo real
docker-compose logs -f

# Ejecutar comando dentro del contenedor
docker-compose exec whatsapp-agent bash

# Detener todo
docker-compose down

# Eliminar imágenes (espacio)
docker-compose down -v

# Reconstruir sin caché
docker-compose up --build --no-cache
```

---

## 📞 Estructura del Proyecto

```
Archivos de configuración Docker:
- Dockerfile              → Imagen multi-stage optimizada
- docker-compose.yml      → Define whatsapp-agent + agent-mock
- .dockerignore          → Archivos excluidos

Configuración:
- package.json           → Dependencias
- .env                   → Variables secretas
- .env.example           → Template ejemplo
- tsconfig.json          → TypeScript config

Código fuente:
- src/index.ts           → Punto de entrada
- src/services/          → Lógica principal
- src/routes/            → Endpoints HTTP
- examples/agent-mock.js → Agente de prueba
```

---

## 🎯 Próximos pasos

1. ✅ Instala Docker Desktop
2. ✅ Copia `.env` y configúralo
3. ✅ `docker-compose up`
4. ✅ Espera logs "Sistema listo..."
5. ✅ Prueba `curl http://localhost:3000/webhook/health`
6. ✅ Configura webhook en Meta
7. ✅ Envía mensaje de prueba
8. ✅ ¡Listo!

---

## 🚀 Deployment a Producción (Railway)

1. Push tu código a GitHub
2. Crea cuenta en: https://railway.app/
3. Conecta tu repo
4. Railway detecta el Dockerfile automáticamente
5. Configura variables de entorno en Railway
6. Deploy automático
7. Obtén URL pública para webhook Meta

---

**¡Tu integración con Docker está 100% lista para usar!** 🐳🚀
