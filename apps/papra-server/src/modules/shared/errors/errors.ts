import type { ContentfulStatusCode } from 'hono/utils/http-status';

export { createError, createErrorFactory, formatPublicErrorPayload, isCustomError, isErrorWithCode };

type ErrorOptions = {
  message: string;
  code: string;
  cause?: unknown;
  statusCode: ContentfulStatusCode;
  isInternal?: boolean;
};

class CustomError extends Error {
  code: string;
  cause?: unknown;
  statusCode: ContentfulStatusCode;
  isInternal: boolean = false;

  constructor({ message, code, cause, statusCode, isInternal = false }: ErrorOptions) {
    super(message);

    this.code = code;
    this.cause = cause;
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
  return error instanceof CustomError;
}

function isErrorWithCode({ error, code }: { error: unknown; code: string }) {
  return isCustomError(error) && error.code === code;
}
