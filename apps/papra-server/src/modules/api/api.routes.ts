import type { Expand } from '@corentinth/chisels';
import type { ApiContract } from './api.contracts';
import type { ApiRequestBodyOutput, ApiRequestSchemaOutput } from './requests/requests.types';
import type {
  ApiResponseBodylessStatus,
  ApiResponseContentType,
} from './responses/responses.types';
import type { GenericSchema, InferOutput } from 'valibot';

type ApiRequestSchema<
  Contract extends ApiContract,
  Key extends keyof NonNullable<ApiContract['request']>,
> = Key extends keyof NonNullable<Contract['request']>
  ? NonNullable<Contract['request']>[Key]
  : undefined;

// Runs before validation and must leave the request body unread.
export type ApiContextResolver = (input: { request: Request }) => unknown;

export type ApiResolvedContext<Resolver> = Resolver extends ApiContextResolver
  ? Awaited<ReturnType<Resolver>>
  : undefined;

export type ApiHandlerInput<Contract extends ApiContract, Context = undefined> = {
  body: ApiRequestBodyOutput<ApiRequestSchema<Contract, 'body'>>;
  query: ApiRequestSchemaOutput<ApiRequestSchema<Contract, 'query'>>;
  params: ApiRequestSchemaOutput<ApiRequestSchema<Contract, 'params'>>;
  request: Request;
  context: Context;
};

type ApiResponseContentResult<Content, Status extends number> = {
  [ContentType in keyof Content & ApiResponseContentType]: Content[ContentType] extends {
    schema: infer Schema extends GenericSchema;
  }
    ? { status: Status; contentType: ContentType; body: InferOutput<Schema> }
    : never;
}[keyof Content & ApiResponseContentType];

export type ApiHandlerResult<Contract extends ApiContract> = {
  [Status in keyof Contract['responses'] & number]: Expand<
    (Status extends ApiResponseBodylessStatus
      ? { status: Status; contentType?: never; body?: never }
      : ApiResponseContentResult<Contract['responses'][Status]['content'], Status>) & {
      headers?: Record<string, string>;
    }
  >;
}[keyof Contract['responses'] & number];

export type ApiHandler<Contract extends ApiContract, Context = undefined> = (
  input: ApiHandlerInput<Contract, Context>,
) => Promise<ApiHandlerResult<Contract>>;

export type ApiRoute<
  Contract extends ApiContract,
  Resolver extends ApiContextResolver | undefined = undefined,
> = {
  contract: Contract;
  handler: ApiHandler<Contract, ApiResolvedContext<Resolver>>;
} & (undefined extends Resolver ? { resolveContext?: Resolver } : { resolveContext: Resolver });

// Infer the contract only from `contract`, not the handler or an enclosing route registry.
// Infer status literals without requiring handlers to use `as const` on their results.
// Separate present and optional resolvers so context is only optional when the hook is.
export function defineApiRoute<
  const Contract extends ApiContract,
  const Status extends keyof Contract['responses'] & number,
  Resolver extends ApiContextResolver | undefined,
>(route: {
  contract: Contract;
  resolveContext: Resolver;
  handler: (
    input: NoInfer<ApiHandlerInput<Contract, ApiResolvedContext<Resolver>>>,
  ) => Promise<NoInfer<ApiHandlerResult<Contract>> & { status: Status }>;
}): NoInfer<ApiRoute<Contract, Resolver>>;
export function defineApiRoute<
  const Contract extends ApiContract,
  const Status extends keyof Contract['responses'] & number,
  Resolver extends ApiContextResolver | undefined = undefined,
>(route: {
  contract: Contract;
  resolveContext?: Resolver;
  handler: (
    input: NoInfer<ApiHandlerInput<Contract, ApiResolvedContext<Resolver | undefined>>>,
  ) => Promise<NoInfer<ApiHandlerResult<Contract>> & { status: Status }>;
}): NoInfer<ApiRoute<Contract, Resolver | undefined>>;
export function defineApiRoute<
  Contract extends ApiContract,
  Resolver extends ApiContextResolver | undefined,
>({
  contract,
  resolveContext,
  handler,
}: {
  contract: Contract;
  resolveContext?: Resolver;
  handler: ApiHandler<Contract, ApiResolvedContext<Resolver>>;
}) {
  return { contract, resolveContext, handler };
}
