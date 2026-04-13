import { getLanguageFromBibleVersion } from './translations';
import type { Language } from '../types/database';

export interface AppLanguageInfo {
  code: Language;
  name: string;
  flag: string;
}

const LANGUAGE_DEFINITIONS: AppLanguageInfo[] = [
  { code: 'LSG', name: 'Français - Louis Segond 1910', flag: '🇫🇷' },
  { code: 'FOB', name: 'Français (FOB) - La Sainte Bible', flag: '🇫🇷' },
  { code: 'darby', name: 'Français - Darby', flag: '🇫🇷' },
  { code: 'DarbyR', name: 'Français - Darby Révisée', flag: '🇫🇷' },
  { code: 'KJV', name: 'English - King James Version', flag: '🇬🇧' },
  { code: 'ITADIO', name: 'Italiano - Giovanni Diodati Bibbia 1649', flag: '🇮🇹' },
  { code: 'CEI', name: 'Italiano - Conferenza Episcopale Italiana', flag: '🇮🇹' },
  { code: 'RVA', name: 'Español - Reina-Valera Antigua', flag: '🇪🇸' },
  { code: 'spavbl', name: 'Español - Versión Biblia Libre', flag: '🇪🇸' },
  { code: 'ELB71', name: 'Deutsch - Elberfelder 1871', flag: '🇩🇪' },
  { code: 'ELB', name: 'Deutsch - Elberfelder 1905', flag: '🇩🇪' },
  { code: 'LUTH1545', name: 'Deutsch - Luther Bibel 1545', flag: '🇩🇪' },
  { code: 'deu1912', name: 'Deutsch - Luther Bibel 1912', flag: '🇩🇪' },
  { code: 'deutkw', name: 'Deutsch - Textbibel von Kautzsch und Weizsäcker', flag: '🇩🇪' },
  { code: 'VULGATE', name: 'Latin - Biblia Sacra Vulgata', flag: '🇻🇦' },
  { code: 'TR1894', name: 'Ελληνικά - Scrivener New Testament 1894', flag: '🇬🇷' },
  { code: 'TR1550', name: 'Ελληνικά - Stephanus New Testament 1550', flag: '🇬🇷' },
  { code: 'WHNU', name: 'Ελληνικά - Westcott-Hort New Testament 1881', flag: '🇬🇷' },
  { code: 'grm', name: 'Ελληνικά - Ελληνική Βίβλος', flag: '🇬🇷' },
  { code: 'WLC', name: 'עברית - כתבי הקודש', flag: '🇮🇱' },
  { code: 'heb', name: 'עברית - תנ ך עברי מודרני', flag: '🇮🇱' },
  { code: 'nld', name: 'Nederlands - De Heilige Schrift 1917', flag: '🇳🇱' },
  { code: 'AA', name: 'Português - Almeida Atualizada', flag: '🇵🇹' },
  { code: 'PBG', name: 'Polski - Biblia Gdańska', flag: '🇵🇱' },
  { code: 'RUSV', name: 'Русский - Синодальный перевод', flag: '🇷🇺' },
];

export const LANGUAGES: AppLanguageInfo[] = LANGUAGE_DEFINITIONS;

const DEFAULT_LANGUAGE_BY_UI_LANGUAGE = LANGUAGE_DEFINITIONS.reduce<Record<string, Language>>((accumulator, language) => {
  const uiLanguage = getLanguageFromBibleVersion(language.code);
  if (!accumulator[uiLanguage]) {
    accumulator[uiLanguage] = language.code;
  }
  return accumulator;
}, {});

function normalizeLocaleCandidates(locale: string): string[] {
  const trimmedLocale = locale.trim();
  if (!trimmedLocale) {
    return [];
  }

  const normalizedLocale = trimmedLocale.replace(/_/g, '-').toLowerCase();
  const [baseLanguage] = normalizedLocale.split('-');

  return baseLanguage && baseLanguage !== normalizedLocale
    ? [normalizedLocale, baseLanguage]
    : [normalizedLocale];
}

export function getDefaultLanguageForLocales(locales: readonly string[]): Language | null {
  for (const locale of locales) {
    const candidates = normalizeLocaleCandidates(locale);
    for (const candidate of candidates) {
      const matchedLanguage = DEFAULT_LANGUAGE_BY_UI_LANGUAGE[candidate];
      if (matchedLanguage) {
        return matchedLanguage;
      }
    }
  }

  return null;
}
