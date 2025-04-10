import { z } from 'zod';

export const booleanishSchema = z
  .coerce
  .string()
  .trim()
  .toLowerCase()
  .transform(x => ['true', '1'].includes(x))
  .pipe(z.boolean());

export const trustedOriginsSchema = z.union([
  z.array(z.string().url()),
  z.string().transform(value => value.split(',')).pipe(z.array(z.string().url())),
]);
