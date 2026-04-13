import * as v from 'valibot';

export function createRegexSchema(regex: RegExp, errorMessage?: string) {
  return v.pipe(v.string(), v.regex(regex, errorMessage));
}
