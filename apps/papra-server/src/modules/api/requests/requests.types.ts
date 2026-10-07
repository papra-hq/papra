import type { GenericSchema, InferOutput } from 'valibot';
import type { apiRequestBodyParsers } from './parsers/body.parsers';

export type ApiRequestContentType = keyof typeof apiRequestBodyParsers;

export type ApiRequestBodySchemas = Partial<Record<ApiRequestContentType, GenericSchema>>;

export type ApiRequestSchemaOutput<
  Schema,
  Fallback = Record<string, never>,
> = Schema extends GenericSchema ? InferOutput<Schema> : Fallback;

export type ApiRequestBodyOutput<Schemas> = Schemas extends ApiRequestBodySchemas
  ? ApiRequestSchemaOutput<Schemas[keyof Schemas], never>
  : undefined;
