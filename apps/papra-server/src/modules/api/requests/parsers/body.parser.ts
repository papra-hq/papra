import type { GenericSchema } from 'valibot';
import type { ApiRequestBodyOutput, ApiRequestBodySchemas } from '../requests.types';
import type { ApiRequestBodyParser } from './body.parsers';
import { safely } from '@corentinth/chisels';
import * as v from 'valibot';
import { apiErrorResponse, apiValidationErrorResponse } from '../../responses/responses';
import { apiRequestBodyParsers } from './body.parsers';

function unsupportedContentTypeResponse(): Response {
  return apiErrorResponse({
    status: 415,
    message: 'Unsupported Content-Type',
    code: 'api.unsupported-content-type',
  });
}

export async function parseBody<
  Schemas extends ApiRequestBodySchemas | undefined = undefined,
>(args: {
  request: Request;
  bodySchemas?: Schemas;
  parsers?: Record<string, ApiRequestBodyParser>;
}): Promise<
  { success: true; body: ApiRequestBodyOutput<Schemas> } | { success: false; response: Response }
>;
export async function parseBody({
  request,
  bodySchemas,
  parsers = apiRequestBodyParsers,
}: {
  request: Request;
  bodySchemas?: Record<string, GenericSchema>;
  parsers?: Record<string, ApiRequestBodyParser>;
}): Promise<{ success: true; body: unknown } | { success: false; response: Response }> {
  if (!bodySchemas) {
    return { success: true, body: undefined };
  }

  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase();

  if (!contentType) {
    return {
      success: false,
      response: unsupportedContentTypeResponse(),
    };
  }

  const schema = bodySchemas[contentType];
  const parser = parsers[contentType];

  if (!schema || !parser) {
    return {
      success: false,
      response: unsupportedContentTypeResponse(),
    };
  }

  const [body, parseError] = await safely(parser.parse(request));

  if (parseError) {
    return {
      success: false,
      response: apiValidationErrorResponse([
        {
          path: 'body',
          message: parser.errorMessage,
        },
      ]),
    };
  }

  const validationResult = v.safeParse(schema, body);

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

  return {
    success: true,
    body: validationResult.output,
  };
}
