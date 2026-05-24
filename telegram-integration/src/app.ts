import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import logger from './utils/logger';
import { config, validateConfig } from './config/env';
import webhookRoutes from './routes/webhook.routes';
import { errorHandler } from './middleware/validation.middleware';
import conversationManager from './services/conversation/manager.service';

const app: Express = express();

// Validar configuración
validateConfig();

// Middleware
app.use(cors());
app.use(express.json());

// Logging de solicitudes
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Rutas de salud (raíz)
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'Telegram Agent Integration',
    version: '1.0.0',
    status: 'running',
    environment: config.nodeEnv,
  });
});

// Endpoint web del agente — mantiene historial por userId igual que el bot de Telegram
app.post('/agent/chat', async (req: Request, res: Response) => {
  try {
    const { message, userId = 'test-user', name } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Campo "message" requerido' });
      return;
    }

    conversationManager.getOrCreateSession(userId, undefined, name);
    conversationManager.addMessage(userId, {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });

    const fullHistory = conversationManager.getConversationHistory(userId);
    const conversationHistory = fullHistory.slice(0, -1);

    const agentClient = (await import('./services/agent/client.service')).default;
    const response = await agentClient.sendMessage({
      userId,
      currentMessage: message,
      conversationHistory,
      metadata: { name },
    });

    conversationManager.addMessage(userId, {
      role: 'agent',
      content: response.response,
      timestamp: Date.now(),
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Rutas de webhooks
app.use('/webhook', webhookRoutes);

// Manejo de rutas no encontradas
app.use((req: Request, res: Response) => {
  logger.warn(`Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware de error global
app.use(errorHandler);

// Funciones de ciclo de vida
function gracefulShutdown(): void {
  logger.info('Iniciando apagado graceful...');
  conversationManager.stop();
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
