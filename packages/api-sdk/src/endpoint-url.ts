import type { EndpointContract, InferClientRequest } from '@papra/app-server/api/contracts/types';

function serializePathValue({ key, value }: { key: string; value: unknown }): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }

  throw new TypeError(`Path parameter "${key}" cannot be serialized`);
}

function serializeQueryValue({ key, value, url }: { key: string; value: unknown; url: URL }) {
  if (value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      serializeQueryValue({ key, value: item, url });
    }
    return;
  }

  if (value instanceof Date) {
    url.searchParams.append(key, value.toISOString());
    return;
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    url.searchParams.append(key, value === null ? '' : String(value));
    return;
  }

  throw new TypeError(`Query parameter "${key}" cannot be serialized`);
}

export function buildEndpointUrl<Contract extends EndpointContract>({
  baseUrl,
  contract,
  request,
}: {
  baseUrl: string;
  contract: Contract;
  request: InferClientRequest<Contract>;
}): string {
  const params = request.params as Record<string, unknown> | undefined;
  const path = contract.path.replace(/:([A-Za-z0-9_]+)/g, (_match, parameterName: string) => {
    const value = params?.[parameterName];

    if (value === undefined || value === null) {
      throw new TypeError(
        `Missing path parameter "${parameterName}" for ${contract.method} ${contract.path}`,
      );
    }

    return encodeURIComponent(serializePathValue({ key: parameterName, value }));
  });

  const normalizedBaseUrl = new URL(baseUrl);
  normalizedBaseUrl.search = '';
  normalizedBaseUrl.hash = '';

  if (!normalizedBaseUrl.pathname.endsWith('/')) {
    normalizedBaseUrl.pathname += '/';
  }

  const url = new URL(path.replace(/^\/+/, ''), normalizedBaseUrl);
  const query = request.query as Record<string, unknown> | undefined;

  for (const [key, value] of Object.entries(query ?? {})) {
    serializeQueryValue({ key, value, url });
  }

  return url.toString();
}
