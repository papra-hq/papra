type ApiErrorContext = {
  method: string;
  path: string;
  status: number;
};

export class ApiHttpError extends Error {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly data: unknown;

  constructor({ method, path, status, data }: ApiErrorContext & { data: unknown }) {
    super(`${method} ${path} failed with status ${status}`);
    this.name = 'ApiHttpError';
    this.method = method;
    this.path = path;
    this.status = status;
    this.data = data;
  }
}

export class ApiResponseError extends Error {
  readonly method: string;
  readonly path: string;
  readonly status: number;

  constructor({
    method,
    path,
    status,
    message,
    cause,
  }: ApiErrorContext & { message: string; cause?: unknown }) {
    super(`${method} ${path}: ${message}`, { cause });
    this.name = 'ApiResponseError';
    this.method = method;
    this.path = path;
    this.status = status;
  }
}
