import { hueForCategory } from '#components/v2lab/categoryHue';
import type { CategoryHue } from '#components/v2lab/reports/ReportsView';

/**
 * Presentation identity for categories the data model does not describe
 * visually: the Reports' name for the shared definition, so the same category
 * is the same colour here as on Início and Orçamento, and "Sem categoria" is
 * grey.
 */
export function hueForId(id: string): CategoryHue {
  return hueForCategory(id);
}
