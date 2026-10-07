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

export type ApiHandlerInput<Contract extends ApiContract> = {
  body: ApiRequestBodyOutput<ApiRequestSchema<Contract, 'body'>>;
  query: ApiRequestSchemaOutput<ApiRequestSchema<Contract, 'query'>>;
  params: ApiRequestSchemaOutput<ApiRequestSchema<Contract, 'params'>>;
  request: Request;
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

export type ApiHandler<Contract extends ApiContract> = (
  input: ApiHandlerInput<Contract>,
) => Promise<ApiHandlerResult<Contract>>;

export type ApiRoute<Contract extends ApiContract> = {
  contract: Contract;
  handler: ApiHandler<Contract>;
};

// Infer the contract only from `contract`, not the handler or an enclosing route registry.
export function defineApiRoute<
  const Contract extends ApiContract,
  // Infer status literals without requiring handlers to use `as const` on their results.
  const Status extends keyof Contract['responses'] & number,
>({
  contract,
  handler,
}: {
  contract: Contract;
  handler: (
    input: NoInfer<ApiHandlerInput<Contract>>,
  ) => Promise<NoInfer<ApiHandlerResult<Contract>> & { status: Status }>;
}): NoInfer<ApiRoute<Contract>> {
  return { contract, handler };
}
