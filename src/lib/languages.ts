export interface LanguageConfig {
  code: string;
  name: string;
  englishName: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: "en-US", name: "English (US)", englishName: "English" },
  { code: "uk-UA", name: "Українська (Ukrainian)", englishName: "Ukrainian" },
  { code: "es-ES", name: "Español (Spanish)", englishName: "Spanish" },
  { code: "de-DE", name: "Deutsch (German)", englishName: "German" },
  { code: "fr-FR", name: "Français (French)", englishName: "French" },
  { code: "it-IT", name: "Italiano (Italian)", englishName: "Italian" },
  { code: "pt-PT", name: "Português (Portuguese)", englishName: "Portuguese" },
  { code: "pl-PL", name: "Polski (Polish)", englishName: "Polish" },
  { code: "tr-TR", name: "Türkçe (Turkish)", englishName: "Turkish" },
  { code: "ja-JP", name: "日本語 (Japanese)", englishName: "Japanese" },
  { code: "zh-CN", name: "中文 (Mandarin)", englishName: "Chinese Mandarin" },
  { code: "ko-KR", name: "한국어 (Korean)", englishName: "Korean" },
  { code: "nl-NL", name: "Nederlands (Dutch)", englishName: "Dutch" },
  { code: "sv-SE", name: "Svenska (Swedish)", englishName: "Swedish" },
  { code: "ar-SA", name: "العربية (Arabic)", englishName: "Arabic" }
];

export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang ? lang.englishName : "English";
}
