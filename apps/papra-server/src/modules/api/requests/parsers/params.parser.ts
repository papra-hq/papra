import type { GenericSchema } from 'valibot';
import type { ApiRequestSchemaOutput } from '../requests.types';
import * as v from 'valibot';
import { apiValidationErrorResponse } from '../../responses/responses';

export function parseParams<Schema extends GenericSchema | undefined = undefined>(args: {
  params?: Record<string, string>;
  schema?: Schema;
}):
  | { success: true; params: ApiRequestSchemaOutput<Schema> }
  | { success: false; response: Response };
export function parseParams({
  params,
  schema,
}: {
  params?: Record<string, string>;
  schema?: GenericSchema;
}): { success: true; params: unknown } | { success: false; response: Response } {
  if (!schema) {
    return { success: true, params: {} };
  }

  const validationResult = v.safeParse(schema, params);

  if (!validationResult.success) {
    const details = validationResult.issues.map((issue) => ({
      path: v.getDotPath(issue),
      message: issue.message,
    }));

    return {
      success: false,
      response: apiValidationErrorResponse(details),
    };
  }

  return { success: true, params: validationResult.output };
}
