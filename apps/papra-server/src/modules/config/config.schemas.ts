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

export const trustedAppSchemeSchema = z.string().regex(/^[a-z][a-z0-9+.-]*[a-z0-9]:\/\/$/i, {
  message: 'Invalid scheme format. Must end with ://, like "papra://"',
});

export const trustedAppSchemesSchema = z.union([
  z.array(trustedAppSchemeSchema),
  z.string().transform(value => value.split(',')).pipe(z.array(trustedAppSchemeSchema)),
]);
