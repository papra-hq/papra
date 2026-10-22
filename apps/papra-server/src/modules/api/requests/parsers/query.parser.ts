import type { GenericSchema } from 'valibot';
import type { ApiRequestSchemaOutput } from '../requests.types';
import * as v from 'valibot';
import { apiValidationErrorResponse } from '../../responses/responses';

export function parseQuery<Schema extends GenericSchema | undefined = undefined>(args: {
  url: URL;
  schema?: Schema;
}):
  | { success: true; query: ApiRequestSchemaOutput<Schema> }
  | { success: false; response: Response };
export function parseQuery({
  url,
  schema,
}: {
  url: URL;
  schema?: GenericSchema;
}): { success: true; query: unknown } | { success: false; response: Response } {
  if (!schema) {
    return { success: true, query: {} };
  }

  const queryParams = Object.fromEntries(url.searchParams.entries());

  const validationResult = v.safeParse(schema, queryParams);

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

  return { success: true, query: validationResult.output };
}
