import type { ComponentType, SVGProps } from 'react';

/**
 * What the Reports' panels are handed to act with.
 *
 * Declared here, beside the panels, and filled by whoever mounts them: the
 * real route reads the period from the address and opens the application's
 * own reports; the laboratory passes neither and the panels draw none of
 * these controls.
 */

/** The month on screen, and the ways to change it. */
export type ReportsPeriodControl = {
  /** `YYYY-MM`. */
  month: string;
  isCurrentMonth: boolean;
  /** "agosto de 2026" — lower case, as Portuguese writes a month. */
  monthLabel: string;
  /** The months the menu offers, latest first. */
  options: Array<{ month: string; label: string; isCurrentMonth: boolean }>;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (month: string) => void;
};

/** "agosto de 2026" where it opens a line: "Agosto de 2026". */
export function capitaliseMonth(label: string): string {
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1);
}

/** One of the detailed reports this page's panels are summaries of. */
export type ReportsDetailLink = {
  id: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  onOpen: () => void;
};
