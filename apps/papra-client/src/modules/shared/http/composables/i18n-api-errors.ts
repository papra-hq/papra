import type { TranslationKeys } from '@/modules/i18n/locales.types';
import { FetchError } from 'ofetch';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { get } from '@/modules/shared/utils/get';

function codeToKey(code: string): TranslationKeys {
  // Better auth may returns different error codes like INVALID_ORIGIN, INVALID_CALLBACKURL when the origin is invalid
  // codes are here https://github.com/better-auth/better-auth/blob/canary/packages/better-auth/src/api/middlewares/origin-check.ts#L71 (in lower case)
  if (code.match(/^INVALID_[A-Z]+URL$/) || code === 'INVALID_ORIGIN') {
    return `api-errors.auth.invalid_origin`;
  }

  return `api-errors.${code}` as TranslationKeys;
}

export function useI18nApiErrors({ t = useI18n().t }: { t?: ReturnType<typeof useI18n>['t'] } = {}) {
  const getErrorMessage = ({ error, defaultMessage = t('api-errors.default') }: { error: unknown; defaultMessage?: string }) => {
    const code = get(
      error,
      ['data', 'error', 'code'], // From fetch errors
      ['details', 'code'], // From custom errors throw in better auth hooks, must be before ['code'] as they have both
      ['code'], // From generic errors
    );

    if (code && typeof code === 'string') {
      const translation = t(codeToKey(code));

      // Fallback to potential error message if translation not found
      if (translation) {
        return translation;
      }
    }

    // Fetch error messages without codes are not helpful
    if (error instanceof FetchError) {
      return defaultMessage;
    }

    const message = get(
      error,
      ['data', 'error', 'message'], // From fetch errors
      ['details', 'message'], // From custom errors throw in better auth hooks, must be before ['message'] as they have both
      ['message'], // From generic errors
    );

    if (message && typeof message === 'string') {
      return message;
    }

    return defaultMessage;
  };

  return {
    getErrorMessage,
    createI18nApiError: (args: { error: unknown }) => {
      return new Error(getErrorMessage(args));
    },
  };
}
