import type { ApiContract } from './api.contracts';
import type { ApiContextResolver, ApiHandlerInput } from './api.routes';
import type { ApiResponse } from './responses/responses.types';
import { addRoute, createRouter, findRoute } from 'rou3';
import { parseBody } from './requests/parsers/body.parser';
import { parseParams } from './requests/parsers/params.parser';
import { parseQuery } from './requests/parsers/query.parser';
import { apiErrorResponse, internalServerErrorResponse } from './responses/responses';
import { serializeApiResponse } from './responses/serialize/responses.serialize';
import { isCustomError } from '../shared/errors/errors';
import type { Logger } from '../shared/logger/logger';
import { createLogger } from '../shared/logger/logger';

// Heterogeneous routes erase their input types only inside the dispatcher. A handler
// cannot be called until its own contract has validated the request.
type RegisteredApiRoute = {
  contract: ApiContract;
  resolveContext?: ApiContextResolver;
  handler: (input: never) => Promise<ApiResponse>;
};

export function buildApiRequestHandler({
  routes,
  logger = createLogger({ namespace: 'api' }),
}: {
  routes: RegisteredApiRoute[];
  logger?: Logger;
}) {
  const router = createRouter<RegisteredApiRoute>();

  for (const route of routes) {
    addRoute(router, route.contract.method, route.contract.path, route);
  }

  return async ({ request }: { request: Request }): Promise<Response> => {
    const url = new URL(request.url);
    const routeMatch = findRoute(router, request.method.toUpperCase(), url.pathname);

    if (!routeMatch) {
      return apiErrorResponse({
        status: 404,
        message: 'API route not found',
        code: 'api.not-found',
      });
    }

    try {
      const {
        data: { handler, contract, resolveContext },
        params,
      } = routeMatch;

      const context = await resolveContext?.({ request });

      const paramsResult = parseParams({ params, schema: contract.request?.params });

      if (!paramsResult.success) {
        return paramsResult.response;
      }

      const queryResult = parseQuery({ url, schema: contract.request?.query });

      if (!queryResult.success) {
        return queryResult.response;
      }

      const bodyResult = await parseBody({ request, bodySchemas: contract.request?.body });

      if (!bodyResult.success) {
        return bodyResult.response;
      }

      const validatedHandler = handler as (
        input: ApiHandlerInput<ApiContract, unknown>,
      ) => Promise<ApiResponse>;
      const handlerResult = await validatedHandler({
        body: bodyResult.body,
        query: queryResult.query,
        params: paramsResult.params,
        request,
        context,
      });

      return serializeApiResponse({
        handlerResult,
        responseDefinitions: contract.responses,
      });
    } catch (error) {
      logger.error({ error }, error instanceof Error ? error.message : 'An error occurred');

      if (isCustomError(error) && !error.isInternal) {
        return apiErrorResponse({
          status: error.statusCode,
          message: error.message,
          code: error.code,
        });
      }

      return internalServerErrorResponse();
    }
  };
}
