import * as v from 'valibot';

export const forbiddenEmailDomainsSchema = v.pipe(
  v.union([
    v.pipe(v.string(), v.transform(value => value.split(','))),
    v.array(v.string()),
  ]),
  v.transform(value => new Set(value.map(v => v.trim().toLowerCase()).filter(v => v.length > 0))),
  v.set(v.pipe(v.string(), v.domain())),
);
