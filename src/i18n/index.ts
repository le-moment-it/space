import { useGameStore } from '../state/gameStore';
import { makeContentTranslator, type ContentTranslator } from './content';
import type { Language } from './types';
import { uiStrings, type UiKey } from './ui';

export type { Language } from './types';
export { LANGUAGES, LANGUAGE_LABELS } from './types';
export type { UiKey } from './ui';

type Params = Record<string, string | number>;

/** Replaces `{name}` placeholders. Unmatched placeholders are left as-is. */
function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key) =>
    key in params ? String(params[key]) : whole,
  );
}

export interface Translator extends ContentTranslator {
  lang: Language;
  t: (key: UiKey, params?: Params) => string;
}

export function makeTranslator(lang: Language): Translator {
  const table = uiStrings[lang];
  return {
    lang,
    t: (key, params) => interpolate(table[key] ?? uiStrings.en[key] ?? key, params),
    ...makeContentTranslator(lang),
  };
}

/**
 * React hook: a translator bound to the current language. Subscribes to the store's
 * `language`, so any component using it re-renders when the language changes.
 */
export function useTranslation(): Translator {
  const lang = useGameStore((s) => s.language);
  return makeTranslator(lang);
}
