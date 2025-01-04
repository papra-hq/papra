import { get } from 'lodash-es';

export { isHttpErrorWithCode, isHttpErrorWithStatusCode, isRateLimitError };

function isHttpErrorWithCode({ error, code }: { error: unknown; code: string }) {
  return get(error, 'body.error.code') === code;
}

function isHttpErrorWithStatusCode({ error, statusCode }: { error: unknown; statusCode: number }) {
  return get(error, 'status') === statusCode;
}

function isRateLimitError({ error }: { error: unknown }) {
  return isHttpErrorWithStatusCode({ error, statusCode: 429 });
}
