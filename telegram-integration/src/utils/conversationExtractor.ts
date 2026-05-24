import { AgentEvents, UserDataUpdate } from '../types/persistence.types';

const PRODUCT_KEYWORDS: Record<string, string[]> = {
  'Crédito de vivienda': ['vivienda', 'casa', 'hipoteca', 'apartamento'],
  'Crédito libre inversión': ['libre inversión', 'libre inversion', 'consumo'],
  'Crédito rotativo': ['rotativo', 'línea de crédito', 'linea de credito'],
  'Crédito vehículo': ['vehículo', 'vehiculo', 'carro', 'moto'],
  'Crédito educativo': ['educativo', 'estudio', 'universidad', 'matrícula'],
  'CDT': ['cdt', 'depósito', 'deposito', 'inversión', 'inversion'],
  'Cuenta de ahorro': ['ahorro', 'cuenta de ahorro'],
  'Tarjeta Olímpica Mastercard': ['tarjeta', 'mastercard', 'olímpica', 'olimpica'],
};

export function inferUserDataFromText(text: string): UserDataUpdate {
  const data: UserDataUpdate = {};
  const normalized = text.trim();

  const emailMatch = normalized.match(/[\w.+-]+@[\w.-]+\.\w{2,}/i);
  if (emailMatch) data.email = emailMatch[0].toLowerCase();

  const cedulaMatch = normalized.match(/\b(\d{6,10})\b/);
  if (cedulaMatch && !looksLikeIncome(cedulaMatch[1])) {
    data.id_number = cedulaMatch[1];
  }

  const incomeMatch = normalized.match(/(\d[\d.,]*)\s*(millones|millón|millon|m\b)?/i);
  if (incomeMatch) {
    const raw = incomeMatch[1].replace(/\./g, '').replace(',', '.');
    let value = parseFloat(raw);
    if (!Number.isNaN(value)) {
      if (/mill/i.test(incomeMatch[2] ?? '') || (value > 0 && value < 100)) {
        value *= 1_000_000;
      }
      if (value >= 100_000) data.monthly_income = value;
    }
  }

  if (normalized.length >= 2 && normalized.length <= 80 && /^[a-záéíóúñü\s]+$/i.test(normalized)) {
    const words = normalized.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      data.name = normalized
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  return data;
}

function looksLikeIncome(value: string): boolean {
  const n = parseInt(value, 10);
  return n >= 500_000;
}

export function inferProductNameFromText(text: string, catalogNames: string[]): string | null {
  const lower = text.toLowerCase();

  for (const [productName, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return productName;
  }

  for (const name of catalogNames) {
    if (lower.includes(name.toLowerCase())) return name;
  }

  return null;
}

export function mergeInferredEvents(
  agentEvents: AgentEvents | null,
  userMessage: string,
  catalogNames: string[]
): AgentEvents {
  const inferredUser = inferUserDataFromText(userMessage);
  const inferredProduct = inferProductNameFromText(userMessage, catalogNames);

  const merged: AgentEvents = { ...(agentEvents ?? {}) };

  if (Object.keys(inferredUser).length > 0) {
    merged.userData = { ...inferredUser, ...(agentEvents?.userData ?? {}) };
  }

  if (!merged.productInterest && inferredProduct) {
    merged.productInterest = {
      productName: inferredProduct,
      outcome: agentEvents?.productInterest?.outcome ?? 'interested',
      rejection_reason: agentEvents?.productInterest?.rejection_reason,
      abandonment_step: agentEvents?.productInterest?.abandonment_step,
    };
  }

  return merged;
}

export function hasPersistableEvents(events: AgentEvents): boolean {
  return Boolean(
    (events.userData && Object.keys(events.userData).length > 0) ||
      events.productInterest ||
      events.appointment ||
      events.closeConversation
  );
}
