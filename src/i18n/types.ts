export type Language = 'en' | 'fr';

export const LANGUAGES: Language[] = ['en', 'fr'];

/** Human-readable, each in its own language (endonyms) for the settings picker. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
};

export const DEFAULT_LANGUAGE: Language = 'en';

const STORAGE_KEY = 'space:lang';

function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'fr';
}

/** App-level preference, stored apart from the save so it needs no schema migration. */
export function loadLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // localStorage unavailable (private mode, SSR) — fall back to default.
  }
  return DEFAULT_LANGUAGE;
}

export function persistLanguage(language: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Best-effort; a failed write just means the choice won't survive reload.
  }
}
