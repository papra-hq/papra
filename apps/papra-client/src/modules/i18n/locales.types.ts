import { translations as defaultTranslations } from '@/locales/en.dictionary';

export type TranslationKeys = keyof typeof defaultTranslations;
export type TranslationsDictionary = Record<TranslationKeys, string>;
 