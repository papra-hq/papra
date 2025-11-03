import { z } from 'zod';

export const booleanishSchema = z
  .coerce
  .string()
  .trim()
  .toLowerCase()
  .transform(x => ['true', '1'].includes(x))
  .pipe(z.boolean());

// Allow both URLs and schemes like "papra://" for mobile apps
const originOrSchemeSchema = z.string().refine(
  (value) => {
    // Allow URLs
    try {
      new URL(value);
      return true;
    } catch {}

    // Allow schemes ending with ://
    return /^[a-z][a-z0-9+.-]*:\/\/$/i.test(value);
  },
  { message: 'Must be a valid URL or scheme (e.g., "papra://")' }
);

export const trustedOriginsSchema = z.union([
  z.array(originOrSchemeSchema),
  z.string().transform(value => value.split(',')).pipe(z.array(originOrSchemeSchema)),
]);
