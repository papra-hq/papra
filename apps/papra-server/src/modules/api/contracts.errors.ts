import * as v from 'valibot';
import { createForbiddenError, createUnauthorizedError } from '../app/auth/auth.errors';
import type { HttpStatusCode } from './http/http.types';

export type PublicApiErrorDefinition<
  Code extends string = string,
  StatusCode extends HttpStatusCode = HttpStatusCode,
> = {
  readonly message: string;
  readonly code: Code;
  readonly statusCode: StatusCode;
  readonly isInternal?: false;
};

export type ApiErrorDetail = v.InferOutput<typeof apiErrorDetailSchema>;
export type ApiErrorResponse = v.InferOutput<typeof apiErrorResponseSchema>;

export const apiErrorDetailSchema = v.object({
  message: v.string(),
  path: v.optional(v.nullable(v.string())),
});

export const apiErrorResponseSchema = v.object({
  error: v.object({
    message: v.string(),
    code: v.string(),
    details: v.optional(v.array(apiErrorDetailSchema)),
  }),
});

export const commonApiErrorDefinitions = [
  {
    message: 'Invalid URL parameters',
    code: 'server.invalid_request.params',
    statusCode: 400,
  },
  {
    message: 'Invalid query parameters',
    code: 'server.invalid_request.query',
    statusCode: 400,
  },
  {
    message: 'Invalid request body',
    code: 'server.invalid_request.body',
    statusCode: 400,
  },
  {
    message: 'Invalid request body',
    code: 'server.invalid_request.malformed_json',
    statusCode: 400,
  },
  createUnauthorizedError.definition,
  createForbiddenError.definition,
  {
    message: 'An error occurred',
    code: 'internal.error',
    statusCode: 500,
  },
] as const satisfies readonly PublicApiErrorDefinition[];
