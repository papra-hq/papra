import { FetchError } from 'ofetch';
import { describe, expect, test } from 'vitest';

import { useI18nApiErrors } from './i18n-api-errors';

function t(key: string) {
  const translations: Record<string, string> = {
    'api-errors.default': 'An error occurred',
    'api-errors.USER_NOT_FOUND': 'User not found',
    'api-errors.INVALID_CREDENTIALS': 'Invalid credentials',
    'api-errors.auth.invalid_origin': 'Invalid origin',
  };

  return translations[key] ?? '';
};

describe('useI18nApiErrors', () => {
  describe('getErrorMessage', () => {
    test('extracts error message from code in data.error.code path', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        data: {
          error: {
            code: 'USER_NOT_FOUND',
          },
        },
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('User not found');
    });

    test('extracts error message from code in details.code path', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        details: {
          code: 'INVALID_CREDENTIALS',
        },
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Invalid credentials');
    });

    test('extracts error message from code in code path', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        code: 'USER_NOT_FOUND',
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('User not found');
    });

    test('handles Better Auth INVALID_ORIGIN error code', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        code: 'INVALID_ORIGIN',
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Invalid origin');
    });

    test('handles Better Auth INVALID_CALLBACKURL error code', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        code: 'INVALID_CALLBACKURL',
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Invalid origin');
    });

    test('handles Better Auth INVALID_REDIRECTURL error code', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        code: 'INVALID_REDIRECTURL',
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Invalid origin');
    });

    test('uses default message when code translation is not found', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        code: 'UNKNOWN_ERROR_CODE',
        message: 'Something went wrong',
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Something went wrong');
    });

    test('extracts message from data.error.message path when code is not available', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        data: {
          error: {
            message: 'Custom error message',
          },
        },
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Custom error message');
    });

    test('extracts message from details.message path when code is not available', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        details: {
          message: 'Custom details message',
        },
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Custom details message');
    });

    test('extracts message from message path when code is not available', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        message: 'Generic error message',
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Generic error message');
    });

    test('prioritizes details.code over code when both are present', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        code: 'USER_NOT_FOUND',
        details: {
          code: 'INVALID_CREDENTIALS',
        },
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Invalid credentials');
    });

    test('prioritizes details.message over message when both are present and code is not available', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        message: 'Generic message',
        details: {
          message: 'Detailed message',
        },
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Detailed message');
    });

    test('uses default message for FetchError without code', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = new FetchError('Network error');

      const message = getErrorMessage({ error });

      expect(message).toBe('An error occurred');
    });

    test('uses custom default message when provided', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = new FetchError('Network error');

      const message = getErrorMessage({ error, defaultMessage: 'Custom default' });

      expect(message).toBe('Custom default');
    });

    test('uses default message for unknown error structure', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {};

      const message = getErrorMessage({ error });

      expect(message).toBe('An error occurred');
    });

    test('handles null error', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const message = getErrorMessage({ error: null });

      expect(message).toBe('An error occurred');
    });

    test('handles undefined error', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const message = getErrorMessage({ error: undefined });

      expect(message).toBe('An error occurred');
    });

    test('handles non-string code value', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        code: 12345,
        message: 'Fallback message',
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('Fallback message');
    });

    test('handles non-string message value', () => {
      const { getErrorMessage } = useI18nApiErrors({ t });

      const error = {
        message: 12345,
      };

      const message = getErrorMessage({ error });

      expect(message).toBe('An error occurred');
    });
  });

  describe('createI18nApiError', () => {
    test('creates an Error with the translated message', () => {
      const { createI18nApiError } = useI18nApiErrors({ t });

      const error = {
        code: 'USER_NOT_FOUND',
      };

      const resultError = createI18nApiError({ error });

      expect(resultError).toBeInstanceOf(Error);
      expect(resultError.message).toBe('User not found');
    });

    test('creates an Error with the default message for unknown error', () => {
      const { createI18nApiError } = useI18nApiErrors({ t });

      const error = {};

      const resultError = createI18nApiError({ error });

      expect(resultError).toBeInstanceOf(Error);
      expect(resultError.message).toBe('An error occurred');
    });

    test('creates an Error with custom message from error', () => {
      const { createI18nApiError } = useI18nApiErrors({ t });

      const error = {
        message: 'Custom error',
      };

      const resultError = createI18nApiError({ error });

      expect(resultError).toBeInstanceOf(Error);
      expect(resultError.message).toBe('Custom error');
    });
  });
});
