import { CategoryName } from './loader.service';

type CategoryRule = {
  category: CategoryName;
  keywords: string[];
};

// Order matters: more specific rules first to avoid false positives
const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'leasing-empresas',
    keywords: ['leasing', 'arrendamiento financiero', 'maquinaria', 'equipo productivo'],
  },
  {
    category: 'seguros-personas',
    keywords: [
      'seguro', 'asistencia', 'cancer', 'cáncer', 'desempleo', 'incapacidad',
      'fraude', 'proteccion tarjeta', 'grupo vida', 'asociado a la deuda',
      'programa de asistencia',
    ],
  },
  {
    category: 'tarjetas',
    keywords: [
      'tarjeta', 'mastercard', 'visa', 'debito', 'débito', 'maestro',
      'olimpica', 'olímpica', 'dgo', 'black', 'cupo tarjeta', 'tarjeta de credito',
      'tarjeta de crédito',
    ],
  },
  {
    category: 'pagos-y-canales-empresas',
    keywords: [
      'pse', 'serfinanza virtual', 'pago de obligaciones', 'pagos a terceros',
      'transferencia empresa', 'canal empresa', 'web chat empresa',
    ],
  },
  {
    category: 'créditos-empresas',
    keywords: [
      'capital de trabajo', 'credito tesoreria', 'crédito tesorería',
      'factoring', 'garantia bancaria', 'garantía bancaria',
      'lineas de redescuento', 'líneas de redescuento', 'sobregiro',
      'descuento de titulos', 'descuento de títulos', 'credito a proveedores',
      'crédito a proveedores', 'vehiculo empresa', 'vehículo empresa',
    ],
  },
  {
    category: 'créditos-personas',
    keywords: [
      'credito', 'crédito', 'prestamo', 'préstamo', 'compra de cartera',
      'libranza', 'educativo', 'isimo', 'libre inversion', 'libre inversión',
      'rotativo', 'vivienda', 'consumo', 'crediplazo', 'vehiculo persona',
      'vehículo persona', 'vehiculo credito', 'vehículo crédito',
    ],
  },
  {
    category: 'ahorro-e-inversión-empresas',
    keywords: [
      'cuenta empresarial', 'cuenta corriente empresa', 'ahorro empresarial',
      'comercios aliados', 'inversion empresa', 'inversión empresa',
    ],
  },
  {
    category: 'ahorro-e-inversión-personas',
    keywords: [
      'cdt', 'super cdt', 'cuenta de ahorro', 'cuenta corriente', 'ahorro',
      'inversion', 'inversión', 'gira mas', 'gira más', 'clicuenta',
      'transfiya', 'plan de ahorro', 'plazo fijo', 'deposito', 'depósito',
    ],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

class MessageClassifier {
  classify(message: string): CategoryName[] {
    const normalized = normalize(message);
    const matched: CategoryName[] = [];

    for (const rule of CATEGORY_RULES) {
      const hit = rule.keywords.some(keyword => normalized.includes(normalize(keyword)));
      if (hit && !matched.includes(rule.category)) {
        matched.push(rule.category);
      }
    }

    return matched;
  }
}

export default new MessageClassifier();
