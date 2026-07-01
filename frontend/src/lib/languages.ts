export interface LanguageConfig {
  code: string;
  name: string;
  englishName: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: "en-US", name: "English (US)", englishName: "English" },
  { code: "uk-UA", name: "Українська (Ukrainian)", englishName: "Ukrainian" }
];

export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang ? lang.englishName : "English";
}
