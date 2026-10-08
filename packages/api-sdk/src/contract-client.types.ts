import type { GenericSchema, InferInput, InferOutput } from 'valibot';

type RequestSchema<Contract, Key extends string> = Contract extends { request: infer Request }
  ? Key extends keyof Request
    ? Request[Key]
    : never
  : never;

type JsonBodySchema<Contract> =
  RequestSchema<Contract, 'body'> extends infer Body
    ? Body extends { 'application/json': infer Schema }
      ? Schema
      : never
    : never;

type RequestField<Key extends string, Schema, AllowEmpty extends boolean = false> = [
  Schema,
] extends [never]
  ? { [K in Key]?: never }
  : Schema extends GenericSchema
    ? AllowEmpty extends true
      ? {} extends InferInput<Schema>
        ? { [K in Key]?: InferInput<Schema> }
        : { [K in Key]: InferInput<Schema> }
      : { [K in Key]: InferInput<Schema> }
    : { [K in Key]?: never };

// These are wire inputs, not the transformed values received by server handlers.
export type ClientRequest<Contract> = RequestField<
  'params',
  RequestSchema<Contract, 'params'>,
  true
> &
  RequestField<'query', RequestSchema<Contract, 'query'>, true> &
  RequestField<'body', JsonBodySchema<Contract>>;

type Responses<Contract> = Contract extends { responses: infer Definitions } ? Definitions : never;

type SuccessStatus<Contract> = {
  [Status in keyof Responses<Contract> & number]: `${Status}` extends `2${string}` ? Status : never;
}[keyof Responses<Contract> & number];

type JsonResponse<Response> = Response extends {
  content: { 'application/json': { schema: infer Schema extends GenericSchema } };
}
  ? InferOutput<Schema>
  : never;

export type ClientResponse<Contract> = {
  [Status in SuccessStatus<Contract>]: Status extends 204 | 205
    ? void
    : JsonResponse<Responses<Contract>[Status]>;
}[SuccessStatus<Contract>];

export type ClientMethod<Contract> = (
  ...args: {} extends ClientRequest<Contract>
    ? [input?: ClientRequest<Contract>]
    : [input: ClientRequest<Contract>]
) => Promise<ClientResponse<Contract>>;

export type ContractClient<Contracts> = {
  [Name in keyof Contracts]: ClientMethod<Contracts[Name]>;
};
