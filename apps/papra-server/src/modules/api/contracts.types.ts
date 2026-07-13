import type { GenericSchema, InferInput, InferOutput } from 'valibot';
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
> = {
  method: Method;
  path: Path;
  params?: ParamsSchema;
  query?: QuerySchema;
  body?: BodySchema;
  responses: Responses;
};

export type InferEndpointRequest<Contract extends EndpointContract> =
  (Contract['params'] extends GenericSchema
    ? { params: InferOutput<Contract['params']> }
    : unknown) &
    (Contract['query'] extends GenericSchema
      ? { query: InferOutput<Contract['query']> }
      : unknown) &
    (Contract['body'] extends GenericSchema ? { body: InferOutput<Contract['body']> } : unknown);

export type InferEndpointResponse<Contract extends EndpointContract> = {
  [Status in keyof Contract['responses'] & HttpStatusCode]: {
    status: Status;
    body: InferInput<NonNullable<Contract['responses'][Status]>>;
  };
}[keyof Contract['responses'] & HttpStatusCode];

// Client-facing: the over-the-wire body for a given status code.
export type InferEndpointResponseBody<
  Contract extends EndpointContract,
  Status extends keyof Contract['responses'] & HttpStatusCode,
> = InferOutput<NonNullable<Contract['responses'][Status]>>;
