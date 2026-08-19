import type { ContentfulStatusCode } from 'hono/utils/http-status';

export {
  createError,
  createErrorFactory,
  formatPublicErrorPayload,
  isCustomError,
  isErrorWithCode,
};

export type ErrorOptions = {
  message: string;
  code: string;
  cause?: unknown;
  statusCode: ContentfulStatusCode;
  isInternal?: boolean;
};

export type ErrorDefinition<
  Code extends string = string,
  StatusCode extends ContentfulStatusCode = ContentfulStatusCode,
> = Omit<ErrorOptions, 'cause' | 'code' | 'statusCode'> & {
  code: Code;
  statusCode: StatusCode;
};

export type ErrorFactory<Definition extends ErrorDefinition = ErrorDefinition> = {
  (options?: { message?: string; cause?: unknown }): CustomError;
  readonly definition: Readonly<Definition>;
};

class CustomError extends Error {
  code: string;
  override cause?: unknown;
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

function createErrorFactory<const Definition extends ErrorDefinition>(
  definition: Definition,
): ErrorFactory<Definition> {
  const factory = ({ message, cause }: { message?: string; cause?: unknown } = {}) => {
    return createError({
      ...definition,
      message: message ?? definition.message,
      cause,
    });
  };

  Object.defineProperty(factory, 'definition', {
    value: Object.freeze({ ...definition }),
    enumerable: true,
    writable: false,
    configurable: false,
  });

  return factory as ErrorFactory<Definition>;
}

function isCustomError(error: unknown): error is CustomError {
  return error instanceof CustomError;
}

function isErrorWithCode({ error, code }: { error: unknown; code: string }) {
  return isCustomError(error) && error.code === code;
}
