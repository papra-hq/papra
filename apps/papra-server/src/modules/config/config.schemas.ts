import * as v from 'valibot';

export const urlSchema = v.pipe(
  v.string(),
  v.url(),
);

export const coercedUrlListSchema = v.union([
  v.array(urlSchema),
  v.pipe(
    v.string(),
    v.transform(value => value.split(',')),
    v.array(urlSchema),
  ),
]);

export const booleanishSchema = v.union(
  [
    v.boolean(),
    v.pipe(
      v.string(),
      v.trim(),
      v.parseBoolean(),
    ),
  ],
  'Expected a boolean or a string that can be parsed as a boolean (e.g. "true", "false", "1", "0")',
);

export const appSchemeSchema = v.union([
  v.pipe(
    v.string(),
    v.transform(value => value.split(',')),
  ),
  v.array(v.string()),
]);
