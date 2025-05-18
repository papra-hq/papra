import type { LocaleKeys } from '@/modules/i18n/locales.types';
import { get } from 'lodash-es';
import { useI18n } from '@/modules/i18n/i18n.provider';

export function useI18nApiErrors({ t = useI18n().t }: { t?: ReturnType<typeof useI18n>['t'] } = {}) {
  const getTranslationFromApiErrorCode = ({ code }: { code: string }) => {
    return t(`api-errors.${code}` as LocaleKeys);
  };

  const getTranslationFromApiError = ({ error }: { error: unknown }) => {
    const code = get(error, 'data.error.code') ?? get(error, 'code');

    if (!code) {
      return t('api-errors.default');
    }

    return getTranslationFromApiErrorCode({ code });
  };

  return {
    getErrorMessage: (args: { error: unknown } | { code: string }) => {
      if ('error' in args) {
        return getTranslationFromApiError({ error: args.error });
      }

      return getTranslationFromApiErrorCode({ code: args.code });
    },
  };
}
