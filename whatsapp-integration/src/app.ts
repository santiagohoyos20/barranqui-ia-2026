import express, { Express, Request, Response } from 'express';
import logger from './utils/logger';
import { config, validateConfig } from './config/env';
import webhookRoutes from './routes/webhook.routes';
import { errorHandler } from './middleware/validation.middleware';
import conversationManager from './services/conversation/manager.service';

const app: Express = express();

// Validar configuración
validateConfig();

// Middleware
app.use(express.json());

// Logging de solicitudes
app.use((req: Request, res: Response, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Rutas de salud
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'WhatsApp Agent Integration',
    version: '1.0.0',
    status: 'running',
    environment: config.nodeEnv,
  });
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
