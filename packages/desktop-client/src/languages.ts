export const languages = import.meta.glob<{
  default: Record<string, string>;
}>(['/locale/*.json', '!/locale/*_old.json']);
