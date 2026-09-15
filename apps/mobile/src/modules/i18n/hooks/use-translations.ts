import { deepMerge } from '@/modules/lib/objects/merge';
import { useLocale } from './use-locale';
import { DEFAULT_LOCALE_KEY } from '../locales';
import type { LocaleRecord } from '../locales';
import type { PartialMessages } from '../i18n.types';

type GenericMessages = Record<string, unknown>;

export type TranslationMap<TDefault extends GenericMessages> = LocaleRecord<
  { messages: TDefault },
  NoInfer<PartialMessages<{ messages: TDefault }>>
>;

export function useTranslations<TDefault extends GenericMessages>(
  translations: TranslationMap<TDefault>,
): TDefault {
  const { locale } = useLocale();
  const localeOverrides = translations[locale] ?? {};

  return deepMerge(translations[DEFAULT_LOCALE_KEY].messages, localeOverrides.messages ?? {});
}
