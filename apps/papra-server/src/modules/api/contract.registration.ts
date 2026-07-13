import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Context, ServerInstance } from '../app/server.types';
import type {
  EndpointContract,
  InferEndpointRequest,
  InferEndpointResponse,
} from './contracts.types';
import * as v from 'valibot';
import { createError } from '../shared/errors/errors';
import type { MiddlewareHandler } from 'hono';
import type { ApiKeyPermissions } from '../api-keys/api-keys.types';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';

export type EndpointHandler<Contract extends EndpointContract, ExtraArgs = unknown> = (
  args: InferEndpointRequest<Contract> & { context: Context } & ExtraArgs,
) => Promise<InferEndpointResponse<Contract>>;

function parseInput<Schema extends v.GenericSchema>({
  schema,
  value,
}: {
  schema?: Schema;
  value: unknown;
}): [v.InferOutput<Schema> | undefined, undefined] | [undefined, v.GenericIssue[]] {
  if (!schema) {
    return [undefined, undefined];
  }

  const result = v.safeParse(schema, value);

  if (result.success) {
    return [result.output, undefined];
  }

  return [undefined, result.issues];
}

function buildErrorResponseBody({
  message,
  code,
  issues,
}: {
  message: string;
  code: string;
  issues?: v.GenericIssue[];
}) {
  return {
    error: {
      message,
      code,
      details: issues?.map((issue) => ({
        path: v.getDotPath(issue),
        message: issue.message,
      })),
    },
  };
}

export function registerEndpoint<Contract extends EndpointContract>({
  app,
  contract,
  middlewares = [],
  handler,
}: {
  app: ServerInstance;
  contract: Contract;
  middlewares?: MiddlewareHandler[];
  handler: EndpointHandler<Contract>;
}) {
  const { method, path } = contract;

  app.on(method, path, ...middlewares, async (context) => {
    const [params, paramsIssues] = parseInput({
      schema: contract.params,
      value: context.req.param(),
    });

    if (paramsIssues) {
      return context.json(
        buildErrorResponseBody({
          message: 'Invalid URL parameters',
          code: 'server.invalid_request.params',
          issues: paramsIssues,
        }),
        400,
      );
    }

    const [query, queryIssues] = parseInput({
      schema: contract.query,
      value: context.req.query(),
    });

    if (queryIssues) {
      return context.json(
        buildErrorResponseBody({
          message: 'Invalid query parameters',
          code: 'server.invalid_request.query',
          issues: queryIssues,
        }),
        400,
      );
    }

    const [requestBody, bodyIssues] = parseInput({
      schema: contract.body,
      value: await context.req.json(),
    });

    if (bodyIssues) {
      return context.json(
        buildErrorResponseBody({
          message: 'Invalid request body',
          code: 'server.invalid_request.body',
          issues: bodyIssues,
        }),
        400,
      );
    }

    const { body, status } = await handler({ params, query, body: requestBody, context });

    const responseSchema = contract.responses[status];

    if (!responseSchema) {
      throw createError({
        message: `No response schema declared for status ${status} on ${contract.method} ${contract.path}`,
        code: 'server.contract.missing_response_schema',
        statusCode: 500,
        isInternal: true,
      });
    }

    const serializedBody = v.parse(responseSchema, body);

    return context.json(serializedBody, status as ContentfulStatusCode);
  });
}

export function registerAuthenticatedEndpoint<const Contract extends EndpointContract>({
  app,
  contract,
  apiKeyPermissions,
  handler,
}: {
  app: ServerInstance;
  contract: Contract;
  apiKeyPermissions?: ApiKeyPermissions[];
  handler: EndpointHandler<Contract, { userId: string }>;
}) {
  registerEndpoint({
    app,
    contract,
    middlewares: [requireAuthentication({ apiKeyPermissions })],
    handler: async (args) => {
      const { context } = args;
      const { userId } = getUser({ context });

      return await handler({ ...args, userId });
    },
  });
}
