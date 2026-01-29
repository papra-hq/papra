import * as v from 'valibot';

const urlSchema = v.pipe(
  v.string(),
  v.trim(),
  v.url(),
  v.transform(url => url.replace(/\/api\/?$/, '')),
);

export function validateServerUrl({ url }: { url: string }) {
  return v.parse(urlSchema, url);
}
