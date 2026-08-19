import type { GenericSchema, InferInput, InferOutput } from 'valibot';
import type { ApiErrorDetail, PublicApiErrorDefinition } from './contracts.errors';
import type { HttpMethod, HttpStatusCode } from './http/http.types';

export type EndpointContract<
  Method extends HttpMethod = HttpMethod,
  Path extends string = string,
  QuerySchema extends GenericSchema | undefined = GenericSchema | undefined,
  ParamsSchema extends GenericSchema | undefined = GenericSchema | undefined,
  BodySchema extends GenericSchema | undefined = GenericSchema | undefined,
  Responses extends Partial<Record<HttpStatusCode, GenericSchema>> = Partial<
    Record<HttpStatusCode, GenericSchema>
  >,
  Errors extends readonly PublicApiErrorDefinition[] = readonly PublicApiErrorDefinition[],
> = {
  method: Method;
  path: Path;
  params?: ParamsSchema;
  query?: QuerySchema;
  body?: BodySchema;
  responses: Responses;
  errors: Errors;
};

// Values received by the endpoint handler after request schemas have been parsed.
export type InferServerRequest<Contract extends EndpointContract> =
  (Contract['params'] extends GenericSchema
    ? { params: InferOutput<Contract['params']> }
    : { params?: never }) &
    (Contract['query'] extends GenericSchema
      ? { query: InferOutput<Contract['query']> }
      : { query?: never }) &
    (Contract['body'] extends GenericSchema
      ? { body: InferOutput<Contract['body']> }
      : { body?: never });

// Values accepted from an SDK caller before they are sent over the wire.
export type InferClientRequest<Contract extends EndpointContract> =
  (Contract['params'] extends GenericSchema
    ? { params: InferInput<Contract['params']> }
    : { params?: never }) &
    (Contract['query'] extends GenericSchema
      ? { query: InferInput<Contract['query']> }
      : { query?: never }) &
    (Contract['body'] extends GenericSchema
      ? { body: InferInput<Contract['body']> }
      : { body?: never });

type EndpointResponseStatus<Contract extends EndpointContract> = keyof Contract['responses'] &
  HttpStatusCode;

export type InferServerResponseBody<
  Contract extends EndpointContract,
  Status extends EndpointResponseStatus<Contract>,
> = InferInput<NonNullable<Contract['responses'][Status]>>;

export type InferClientResponseBody<
  Contract extends EndpointContract,
  Status extends EndpointResponseStatus<Contract>,
> = InferOutput<NonNullable<Contract['responses'][Status]>>;

// Values accepted from the endpoint handler before response schemas normalize them.
export type InferServerResponse<Contract extends EndpointContract> = {
  [Status in EndpointResponseStatus<Contract>]: {
    status: Status;
    body: InferServerResponseBody<Contract, Status>;
  };
}[EndpointResponseStatus<Contract>];

export type InferClientErrorResponse<Definition extends PublicApiErrorDefinition> =
  Definition extends PublicApiErrorDefinition
    ? {
        status: Definition['statusCode'];
        body: {
          error: {
            message: string;
            code: Definition['code'];
            details?: ApiErrorDetail[];
          };
        };
      }
    : never;

// Values returned to an SDK caller after response and error schemas have parsed the wire payload.
export type InferClientResponse<Contract extends EndpointContract> =
  | {
      [Status in EndpointResponseStatus<Contract>]: {
        status: Status;
        body: InferClientResponseBody<Contract, Status>;
      };
    }[EndpointResponseStatus<Contract>]
  | InferClientErrorResponse<Contract['errors'][number]>;
