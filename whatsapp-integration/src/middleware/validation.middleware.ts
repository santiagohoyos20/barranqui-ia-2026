import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import whatsappWebhookService from '../services/whatsapp/webhook.service';
import { ValidationError } from '../utils/errors';

/**
 * Valida el token de webhook de WhatsApp
 */
export function validateWebhookToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.query.hub_verify_token as string;

  if (!whatsappWebhookService.validateWebhookToken(token)) {
    logger.warn('Token de webhook inválido');
    res.status(403).json({ error: 'Token de webhook inválido' });
    return;
  }

  next();
}

/**
 * Valida que el cuerpo de la solicitud sea JSON válido
 */
export function validateJsonBody(req: Request, res: Response, next: NextFunction): void {
  if (!req.body || typeof req.body !== 'object') {
    const error = new ValidationError('El cuerpo de la solicitud debe ser JSON válido');
    logger.warn('JSON inválido en webhook', { error: error.message });
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  next();
}

/**
 * Valida que el webhook sea del tipo esperado
 */
export function validateWebhookType(req: Request, res: Response, next: NextFunction): void {
  const { object } = req.body;

  if (object !== 'whatsapp_business_account') {
    const error = new ValidationError(`Tipo de webhook no esperado: ${object}`);
    logger.warn('Tipo de webhook inválido', { object });
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
