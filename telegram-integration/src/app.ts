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

// Endpoint web del agente — asesores internos, sin persistencia en DB
app.post('/agent/chat', async (req: Request, res: Response) => {
  try {
    const { message, userId = 'web-advisor', name } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Campo "message" requerido' });
      return;
    }

    const messageOrchestrator = (await import('./services/orchestrator/message.orchestrator')).default;
    const cleanText = await messageOrchestrator.processWebChat(userId, message, name);

    res.json({
      response: cleanText,
      confidence: 1,
      metadata: { channel: 'web' },
    });
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
