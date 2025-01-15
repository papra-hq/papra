import { get } from 'lodash-es';

export function isAuthErrorWithCode({ error, code }: { error: unknown; code: string }) {
  return get(error, 'code') === code;
}

export const isEmailVerificationRequiredError = ({ error }: { error: unknown }) => isAuthErrorWithCode({ error, code: 'EMAIL_NOT_VERIFIED' });
