import type { Locale } from '../i18n/i18n.constants';
import type { TranslationsDictionary } from '../i18n/i18n.types';
import { translations as en } from './en';
import { translations as fr } from './fr';

export const translations: Record<Locale, TranslationsDictionary | Partial<TranslationsDictionary>> = {
  en,
  fr,
};
