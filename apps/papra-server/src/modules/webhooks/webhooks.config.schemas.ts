import * as v from 'valibot';

export const allowedWebhookUrlHostnamesSchema = v.pipe(
  v.union([
    v.array(v.string()),
    v.pipe(v.string(), v.transform(str => str.split(','))),
  ]),
  v.transform(arr => new Set(arr.map(s => s.trim().toLowerCase()).filter(s => s.length > 0))),
);
