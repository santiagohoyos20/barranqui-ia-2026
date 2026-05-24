import * as path from 'path';
import loader, { CategoryName } from './loader.service';
import classifier from './classifier.service';
import logger from '../../utils/logger';

class KnowledgeService {
  init(basePath: string): void {
    const resolved = path.isAbsolute(basePath)
      ? basePath
      : path.resolve(process.cwd(), basePath);

    logger.info(`[Knowledge] Inicializando desde: ${resolved}`);
    loader.load(resolved);
  }

  getContext(message: string): string {
    if (!loader.isLoaded()) {
      logger.warn('[Knowledge] Servicio no inicializado, omitiendo contexto');
      return '';
    }

    const categories = classifier.classify(message);

    if (categories.length === 0) {
      logger.info('[Knowledge] Sin categoría detectada, usando resúmenes como fallback');
      const fallback = loader.getCategory('resumenes');
      if (!fallback) logger.warn('[Knowledge] ⚠️  Resúmenes vacíos — verificar ruta de archivos');
      return this.buildBlock(['resumenes'], fallback ? [fallback] : []);
    }

    logger.info(`[Knowledge] Categorías detectadas: ${categories.join(', ')}`);
    const contents = categories
      .map(cat => loader.getCategory(cat))
      .filter(c => c.length > 0);

    if (contents.length === 0) {
      logger.warn(`[Knowledge] ⚠️  Categorías detectadas pero sin contenido — verificar ruta de archivos`);
      return '';
    }

    const context = this.buildBlock(categories, contents);
    logger.info(`[Knowledge] Contexto inyectado: ${contents.length} sección(es), ${context.length} caracteres`);
    return context;
  }

  private buildBlock(categories: CategoryName[], contents: string[]): string {
    if (contents.length === 0) return '';

    const label = categories.join(', ');
    return [
      `=== INFORMACIÓN DE PRODUCTOS SERFINANZA (${label}) ===`,
      '',
      contents.join('\n\n---\n\n'),
      '',
      '=== FIN DE INFORMACIÓN DE PRODUCTOS ===',
    ].join('\n');
  }
}

export default new KnowledgeService();
