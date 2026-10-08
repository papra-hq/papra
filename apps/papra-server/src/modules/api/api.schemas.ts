import * as v from 'valibot';

export const isoDateStringSchema = v.pipe(v.string(), v.isoTimestamp());
