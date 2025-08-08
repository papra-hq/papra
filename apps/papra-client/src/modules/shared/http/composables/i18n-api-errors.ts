import type { LocaleKeys } from '@/modules/i18n/locales.types';
import { get } from 'lodash-es';
import { useI18n } from '@/modules/i18n/i18n.provider';

function codeToKey(code: string): LocaleKeys {
  // Better auth may returns different error codes like INVALID_ORIGIN, INVALID_CALLBACKURL when the origin is invalid
  // codes are here https://github.com/better-auth/better-auth/blob/canary/packages/better-auth/src/api/middlewares/origin-check.ts#L71 (in lower case)
  if (code.match(/^INVALID_[A-Z]+URL$/) || code === 'INVALID_ORIGIN') {
    return `api-errors.auth.invalid_origin`;
  }

  return `api-errors.${code}` as LocaleKeys;
}

export function useI18nApiErrors({ t = useI18n().t }: { t?: ReturnType<typeof useI18n>['t'] } = {}) {
  const getDefaultErrorMessage = () => t('api-errors.default');

  const getErrorMessage = (args: { error: unknown } | { code: string }) => {
    if ('code' in args) {
      const { code } = args;
      return t(codeToKey(code)) ?? getDefaultErrorMessage();
    }

    if ('error' in args) {
      const { error } = args;
      const code = get(error, 'data.error.code') ?? get(error, 'code');
      const translation = code ? t(codeToKey(code)) : undefined;

      if (translation) {
        return translation;
      }

      if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
        return error.message;
      }
    }

    return getDefaultErrorMessage();
  };

  return {
    getErrorMessage,
    createI18nApiError: (args: { error: unknown } | { code: string }) => {
      return new Error(getErrorMessage(args));
    },
  };
}
