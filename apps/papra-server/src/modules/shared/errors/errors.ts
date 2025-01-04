import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { get, isError, toString } from 'lodash-es';

export { createError, createErrorFactory, formatPublicErrorPayload, isCustomError };

type ErrorOptions = {
  message: string;
  code: string;
  cause?: unknown;
  statusCode: ContentfulStatusCode;
  isInternal?: boolean;
};

class CustomError extends Error {
  code: string;
  cause?: Error | null;
  statusCode: ContentfulStatusCode;
  isCustomError = true;
  isInternal?: boolean;

  constructor({ message, code, cause, statusCode, isInternal }: ErrorOptions) {
    super(message);

    this.code = code;
    this.cause = isError(cause) ? cause : new Error(toString(cause));
    this.statusCode = statusCode;
    this.isInternal = isInternal;
  }
}

function formatPublicErrorPayload({ message, code }: { message: string; code: string }) {
  return { error: { message, code } };
}

function createError(options: ErrorOptions) {
  return new CustomError(options);
}

function createErrorFactory(baseOption: ErrorOptions) {
  return (options: Partial<ErrorOptions> = {}) => {
    return createError({ ...baseOption, ...options });
  };
}

function isCustomError(error: unknown): error is CustomError {
  return get(error, 'isCustomError') === true && isError(error);
}
