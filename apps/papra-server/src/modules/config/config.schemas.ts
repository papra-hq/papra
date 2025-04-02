import { z } from 'zod';

export const booleanishSchema = z
  .coerce
  .string()
  .trim()
  .toLowerCase()
  .transform(x => ['true', '1'].includes(x))
  .pipe(z.boolean());
