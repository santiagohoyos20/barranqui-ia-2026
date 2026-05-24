import * as fs from 'fs';
import * as path from 'path';
import logger from '../../utils/logger';
import { config } from '../../config/env';

const KEYWORD_MAP: Record<string, string[]> = {
  'creditos_personas.md': ['credito', 'crédito', 'prestamo', 'préstamo', 'vivienda', 'vehiculo', 'vehículo', 'libranza', 'libre inversion', 'libre inversión', 'educativo', 'cartera', 'crediplazo', 'rotativo'],
  'ahorro_inversion_personas.md': ['ahorro', 'cdt', 'inversion', 'inversión', 'cuenta', 'clicuenta', 'deposito', 'depósito'],
  'tarjetas.md': ['tarjeta', 'mastercard', 'debito', 'débito', 'olimpica', 'olímpica'],
  'seguros_personas.md': ['seguro', 'vida', 'fraude', 'cancer', 'cáncer'],
};

class KnowledgeLoaderService {
  private cache: Map<string, string> = new Map();

  /**
   * Busca contexto relevante en los resúmenes de productos según el mensaje del usuario.
   */
  getContextForMessage(message: string): string {
    const basePath = path.join(config.knowledge.basePath, 'resumenes');
    if (!fs.existsSync(basePath)) {
      logger.warn('Knowledge base resumenes no encontrada', { basePath });
      return '';
    }

    const normalized = message.toLowerCase();
    const matchedFiles: string[] = [];

    for (const [file, keywords] of Object.entries(KEYWORD_MAP)) {
      if (keywords.some((kw) => normalized.includes(kw))) {
        matchedFiles.push(file);
      }
    }

    if (matchedFiles.length === 0) {
      matchedFiles.push('creditos_personas.md');
    }

    const sections = matchedFiles.slice(0, 2).map((file) => {
      const content = this.loadFile(path.join(basePath, file));
      if (!content) return '';
      const excerpt = content.slice(0, 6000);
      return `--- ${file} ---\n${excerpt}`;
    });

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Lista de productos disponibles para el prompt del agente.
   */
  getProductCatalogHint(productNames: string[]): string {
    if (productNames.length === 0) return '';
    return (
      'Productos disponibles en el catálogo (usa estos nombres exactos en eventos):\n' +
      productNames.map((n) => `- ${n}`).join('\n')
    );
  }

  private loadFile(filePath: string): string {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      this.cache.set(filePath, content);
      return content;
    } catch {
      logger.warn('No se pudo leer archivo de knowledge', { filePath });
      return '';
    }
  }
}

export default new KnowledgeLoaderService();
