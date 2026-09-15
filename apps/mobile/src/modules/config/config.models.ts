import * as v from 'valibot';

const urlSchema = v.pipe(
  v.string(),
  v.trim(),
  v.url(),
  v.transform((url) => url.replace(/\/api\/?$/, '')),
);

export function validateServerUrl({ url }: { url: string }) {
  return v.parse(urlSchema, url);
}

const apiServerConfigSchema = v.object({
  baseUrl: v.pipe(v.string(), v.url()),
  customHeaders: v.record(v.string(), v.string()),
});

export type ApiServerConfig = v.InferOutput<typeof apiServerConfigSchema>;

export function parseApiServerConfig({ config }: { config: unknown }) {
  return v.parse(apiServerConfigSchema, config);
}

export type CustomHeader = {
  name: string;
  value: string;
};

// RFC 9110 token characters, the only ones allowed in a header name
const HEADER_NAME_REGEX = /^[!#$%&'*+\-.^_`|~a-z0-9]+$/i;

// Headers that are either managed by the app (auth cookies, content negotiation)
// or reserved by the fetch spec, and must not be overridden by user-provided headers
const FORBIDDEN_HEADER_NAMES = new Set([
  'accept-charset',
  'accept-encoding',
  'connection',
  'content-length',
  'content-type',
  'cookie',
  'cookie2',
  'date',
  'dnt',
  'expect',
  'host',
  'keep-alive',
  'origin',
  'referer',
  'set-cookie',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'via',
]);

const FORBIDDEN_HEADER_PREFIXES = ['proxy-', 'sec-', 'access-control-'];

export function isForbiddenHeaderName({ name }: { name: string }) {
  const lowerCasedName = name.toLowerCase();

  return (
    FORBIDDEN_HEADER_NAMES.has(lowerCasedName) ||
    FORBIDDEN_HEADER_PREFIXES.some((prefix) => lowerCasedName.startsWith(prefix))
  );
}

export type CustomHeaderIssueCode =
  | 'empty-name'
  | 'invalid-name'
  | 'forbidden-name'
  | 'invalid-value';

type CustomHeaderIssue = {
  code: CustomHeaderIssueCode;
  headerName: string;
};

export function validateCustomHeaders({ headers }: { headers: CustomHeader[] }):
  | {
      success: true;
      headers: Record<string, string>;
    }
  | {
      success: false;
      issue: CustomHeaderIssue;
    } {
  const validatedHeaders: Record<string, string> = {};

  for (const header of headers) {
    const name = header.name.trim();
    const value = header.value.trim();

    // Fully empty rows are just leftovers from the form, skip them
    if (name === '' && value === '') {
      continue;
    }

    if (name === '') {
      return {
        success: false,
        issue: {
          code: 'empty-name',
          headerName: name,
        },
      };
    }

    if (!HEADER_NAME_REGEX.test(name)) {
      return {
        success: false,
        issue: {
          code: 'invalid-name',
          headerName: name,
        },
      };
    }

    if (isForbiddenHeaderName({ name })) {
      return {
        success: false,
        issue: {
          code: 'forbidden-name',
          headerName: name,
        },
      };
    }

    if (/[\r\n]/.test(value)) {
      return {
        success: false,
        issue: {
          code: 'invalid-value',
          headerName: name,
        },
      };
    }

    validatedHeaders[name] = value;
  }

  return {
    success: true,
    headers: validatedHeaders,
  };
}
