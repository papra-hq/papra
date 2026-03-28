import * as v from 'valibot';

export const integerSchema = v.pipe(
  v.number(),
  v.integer(),
);

export const positiveIntegerSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(0),
);

export const coercedNumberSchema = v.union([
  v.number(),
  v.pipe(v.string(), v.toNumber()),
]);

export const coercedIntegerSchema = v.union([
  integerSchema,
  v.pipe(v.string(), v.toNumber(), integerSchema),
]);

export const coercedPositiveIntegerSchema = v.union([
  positiveIntegerSchema,
  v.pipe(v.string(), v.toNumber(), positiveIntegerSchema),
]);

export const strictlyPositiveIntegerSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
);

export const coercedStrictlyPositiveIntegerSchema = v.union([
  strictlyPositiveIntegerSchema,
  v.pipe(v.string(), v.toNumber(), strictlyPositiveIntegerSchema),
]);
