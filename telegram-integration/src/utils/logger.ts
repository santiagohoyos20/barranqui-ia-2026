import winston from 'winston';
import { config } from '../config/env';

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const { service: _service, ...rest } = meta;
    const metaStr = Object.keys(rest).length ? JSON.stringify(rest) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const transports: winston.transport[] = [
  // Siempre imprimir en consola (Railway, Render, Docker logs)
  new winston.transports.Console({ format: consoleFormat }),
];

// Archivos solo en desarrollo local (en producción/cloud suele fallar por permisos)
if (config.nodeEnv !== 'production') {
  transports.push(
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  );
}

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'telegram-agent-integration' },
  transports,
});

export default logger;
