import type { GenericSchema, InferInput, InferOutput } from 'valibot';

export type JsonSerializableValue = string | number | boolean | null | JsonSerializableValue[] | { [key: string]: JsonSerializableValue };

export type JsonSchema = GenericSchema<JsonSerializableValue, JsonSerializableValue>;

export type KvStoreScope<TInput, TOutput = TInput> = {
  get: (key: string) => Promise<TOutput | undefined>;
  set: (key: string, value: TInput, options?: { expiresAt?: Temporal.Instant }) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

export type KvStore = {
  defineScope: <TSchema extends JsonSchema>(args: {
    prefix: string;
    schema: TSchema;
  }) => KvStoreScope<InferInput<TSchema>, InferOutput<TSchema>>;
  // Only present for lazy-delete drivers (e.g. libsql) that accumulate expired entries; eager drivers (e.g. in-memory) omit it.
  purgeExpired?: () => Promise<{ deletedCount: number }>;
};
