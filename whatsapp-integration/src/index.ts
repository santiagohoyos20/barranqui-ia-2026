import app from './app';
import logger from './utils/logger';
import { config } from './config/env';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
  logger.info(`📍 Ambiente: ${config.nodeEnv}`);
  logger.info(`📝 Nivel de log: ${config.logLevel}`);
  logger.info(`🤖 Agente IA: ${config.agent.model}`);
  logger.info('✅ Sistema listo para recibir mensajes de WhatsApp');
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`El puerto ${PORT} ya está en uso`);
  } else {
    logger.error('Error del servidor', { error: error.message });
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada sin manejo', {
    reason: reason instanceof Error ? reason.message : reason,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada', { error: error.message });
  process.exit(1);
});

export default server;
