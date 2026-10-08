import type { ApiContract } from '@papra/app-server/api/contract';
import type { ContractClient } from './contract-client.types';
import type { ApiClient } from './http-client';
import * as v from 'valibot';
import { ApiHttpError, ApiResponseError } from './contract-client.errors';

type RequestInput = {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
};

export function createContractClient<const Contracts extends Record<string, ApiContract>>({
  contracts,
  apiClient,
}: {
  contracts: Contracts;
  apiClient: ApiClient;
}): ContractClient<Contracts> {
  const entries = Object.entries(contracts).map(([name, contract]) => {
    assertSupportedContract(contract);

    return [
      name,
      async (input: RequestInput = {}) => executeRequest({ contract, apiClient, input }),
    ];
  });

  // Dynamic registry iteration erases the correlation between each name and its contract.
  // Keep that assertion here; callers retain their contract's request and response types.
  return Object.fromEntries(entries) as ContractClient<Contracts>;
}

function assertSupportedContract(contract: ApiContract) {
  const bodyTypes = Object.keys(contract.request?.body ?? {});

  if (contract.request?.body && (bodyTypes.length !== 1 || bodyTypes[0] !== 'application/json')) {
    throw new TypeError(
      `${contract.method} ${contract.path}: only JSON request bodies are supported`,
    );
  }

  for (const [status, response] of Object.entries(contract.responses)) {
    const contentTypes = Object.keys(response.content);
    const isBodyless = ['204', '205', '304'].includes(status);

    if (
      isBodyless
        ? contentTypes.length !== 0
        : contentTypes.length !== 1 || contentTypes[0] !== 'application/json'
    ) {
      throw new TypeError(
        `${contract.method} ${contract.path}: only JSON or bodyless responses are supported`,
      );
    }
  }
}

function serializeValue(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    throw new TypeError('Path and query parameters must be strings, numbers, or booleans');
  }

  return String(value);
}

function buildRequestPath({ contract, input }: { contract: ApiContract; input: RequestInput }) {
  const path = contract.path.replace(/:([A-Za-z0-9_]+)/g, (_, name: string) => {
    const value = input.params?.[name];

    if (value === undefined || value === null) {
      throw new TypeError(`Missing path parameter: ${name}`);
    }

    const serialized = serializeValue(value);

    if (serialized === '.' || serialized === '..') {
      throw new TypeError(`Invalid path parameter: ${name}`);
    }

    return encodeURIComponent(serialized);
  });
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(input.query ?? {})) {
    if (value !== undefined && value !== null) {
      query.set(key, serializeValue(value));
    }
  }

  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

async function executeRequest({
  contract,
  apiClient,
  input,
}: {
  contract: ApiContract;
  apiClient: ApiClient;
  input: RequestInput;
}): Promise<unknown> {
  const path = buildRequestPath({ contract, input });
  const hasBody = contract.request?.body !== undefined;
  const response = await apiClient.raw(path, {
    method: contract.method,
    headers: {
      Accept: 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    body: hasBody ? JSON.stringify(input.body) : undefined,
    // Read text so malformed JSON cannot be accepted by ofetch's permissive JSON parser.
    responseType: 'text',
    ignoreResponseError: true,
    retry: 0,
  });
  const errorContext = { method: contract.method, path: contract.path, status: response.status };

  if (!response.ok) {
    let data: unknown = response._data;

    try {
      data = JSON.parse(response._data ?? '');
    } catch {
      // Proxies and older servers may return non-JSON error bodies.
    }

    throw new ApiHttpError({ ...errorContext, data });
  }

  const definition = contract.responses[response.status];

  if (!definition) {
    throw new ApiResponseError({ ...errorContext, message: 'Undeclared response status' });
  }

  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const contentType = response.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase();
  const schema = definition.content['application/json']?.schema;

  if (contentType !== 'application/json' || !schema) {
    throw new ApiResponseError({ ...errorContext, message: 'Unexpected response Content-Type' });
  }

  try {
    return v.parse(schema, JSON.parse(response._data ?? ''));
  } catch (cause) {
    throw new ApiResponseError({
      ...errorContext,
      message: 'Response does not match its contract',
      cause,
    });
  }
}
