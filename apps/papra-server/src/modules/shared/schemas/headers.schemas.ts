import * as v from 'valibot';

export const headersDefinitionSchema = v.record(v.string(), v.string());

export const headersDefinitionStringSchema = v.pipe(
  v.string(),
  v.parseJson(),
  headersDefinitionSchema,
);
