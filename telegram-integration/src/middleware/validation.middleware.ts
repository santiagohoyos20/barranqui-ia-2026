import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import telegramWebhookService from '../services/telegram/webhook.service';
import { ValidationError } from '../utils/errors';

/**
 * Valida el secret token enviado por Telegram en la cabecera
 * X-Telegram-Bot-Api-Secret-Token al hacer POST al webhook.
 */
export function validateTelegramSecretToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const headerToken = req.header('X-Telegram-Bot-Api-Secret-Token') || undefined;

  if (!telegramWebhookService.validateSecretToken(headerToken)) {
    logger.warn('Secret token de Telegram inválido');
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
}

/**
 * Valida que el cuerpo de la solicitud sea JSON válido
 */
export function validateJsonBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.body || typeof req.body !== 'object') {
    const error = new ValidationError('El cuerpo de la solicitud debe ser JSON válido');
    logger.warn('JSON inválido en webhook', { error: error.message });
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  next();
}

/**
 * Valida que el body tenga la forma esperada de un Telegram Update
 */
export function validateTelegramUpdate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const update = req.body;

  if (typeof update?.update_id !== 'number') {
    const error = new ValidationError('Update de Telegram inválido (falta update_id)');
    logger.warn('Update inválido', { body: req.body });
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  next();
}

/**
 * Middleware de error global
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  logger.error('Error en la solicitud', {
    path: req.path,
    method: req.method,
    error: err.message,
  });

  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
  } else {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
