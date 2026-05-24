import * as fs from 'fs';
import * as path from 'path';
import logger from '../../utils/logger';

export type CategoryName =
  | 'ahorro-e-inversión-personas'
  | 'ahorro-e-inversión-empresas'
  | 'créditos-personas'
  | 'créditos-empresas'
  | 'tarjetas'
  | 'pagos-y-canales-empresas'
  | 'leasing-empresas'
  | 'seguros-personas'
  | 'resumenes';

export const ALL_CATEGORIES: CategoryName[] = [
  'ahorro-e-inversión-personas',
  'ahorro-e-inversión-empresas',
  'créditos-personas',
  'créditos-empresas',
  'tarjetas',
  'pagos-y-canales-empresas',
  'leasing-empresas',
  'seguros-personas',
  'resumenes',
];

class KnowledgeLoader {
  private cache = new Map<CategoryName, string>();
  private loaded = false;

  load(basePath: string): void {
    if (this.loaded) return;

    let totalFiles = 0;
    for (const category of ALL_CATEGORIES) {
      const categoryPath = path.join(basePath, category);

      if (!fs.existsSync(categoryPath)) {
        logger.warn(`[Knowledge] Carpeta no encontrada: ${categoryPath}`);
        continue;
      }

      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'));
      if (files.length === 0) continue;

      const contents = files.map(file => {
        const filePath = path.join(categoryPath, file);
        return fs.readFileSync(filePath, 'utf-8');
      });

      this.cache.set(category, contents.join('\n\n---\n\n'));
      totalFiles += files.length;
      logger.info(`[Knowledge] Cargada: ${category} (${files.length} archivos)`);
    }

    this.loaded = true;
    logger.info(`[Knowledge] Base de conocimiento lista: ${this.cache.size} categorías, ${totalFiles} archivos`);
  }

  getCategory(name: CategoryName): string {
    return this.cache.get(name) ?? '';
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

export default new KnowledgeLoader();
