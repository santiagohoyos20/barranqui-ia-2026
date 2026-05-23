export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class WhatsAppError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, message, details);
    this.name = 'WhatsAppError';
    Object.setPrototypeOf(this, WhatsAppError.prototype);
  }
}

export class AgentError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(500, message, details);
    this.name = 'AgentError';
    Object.setPrototypeOf(this, AgentError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(422, message, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(404, message, details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
