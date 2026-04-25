import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';

export type Language = 'en' | 'hi' | 'es' | 'fr';

export const SUPPORTED_LANGUAGES: { code: Language; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', flag: '🇮🇳' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
];

const translations: Record<Language, typeof en> = { en, hi: hi as typeof en, es: es as typeof en, fr: fr as typeof en };

export function getTranslations(language: Language): typeof en {
  return translations[language] ?? translations.en;
}

export const LANGUAGE_STORAGE_KEY = 'safetap_language';

export function getSavedLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
  if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) return saved;
  return 'en';
}

export function saveLanguage(lang: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }
}

/** Replace {key} placeholders in a string */
export function t(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
