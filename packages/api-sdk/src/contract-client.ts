import { apiContract } from '@papra/app-server/api/contracts';
import { apiErrorResponseSchema } from '@papra/app-server/api/contracts/errors';
import type {
  EndpointContract,
  InferClientRequest,
  InferClientResponse,
} from '@papra/app-server/api/contracts/types';
import * as v from 'valibot';
import { PapraContractError } from './contract-client.errors';
import { buildEndpointUrl } from './endpoint-url';

export type ContractClientAuthentication = { type: 'api-key'; token: string } | { type: 'session' };

export type CreateApiClientOptions = {
  baseUrl: string;
  authentication?: ContractClientAuthentication;
  fetch?: typeof globalThis.fetch;
};

type ApiContract = typeof apiContract;

type ApiClientMethod<Contract extends EndpointContract> =
  {} extends InferClientRequest<Contract>
    ? (request?: InferClientRequest<Contract>) => Promise<InferClientResponse<Contract>>
    : (request: InferClientRequest<Contract>) => Promise<InferClientResponse<Contract>>;

export type ApiClient = {
  [Name in keyof ApiContract]: ApiClientMethod<ApiContract[Name]>;
};

export function createApiClient(options: CreateApiClientOptions): ApiClient {
  return Object.fromEntries(
    Object.entries(apiContract).map(([name, contract]) => [
      name,
      createApiClientMethod({ contract, options }),
    ]),
  ) as unknown as ApiClient;
}

function createApiClientMethod<Contract extends EndpointContract>({
  contract,
  options,
}: {
  contract: Contract;
  options: CreateApiClientOptions;
}): ApiClientMethod<Contract> {
  const method = async (
    request: InferClientRequest<Contract> = {} as InferClientRequest<Contract>,
  ) =>
    callEndpoint({
      ...options,
      contract,
      request,
    });

  return method as ApiClientMethod<Contract>;
}

export async function callEndpoint<Contract extends EndpointContract>({
  baseUrl,
  contract,
  request,
  authentication,
  fetch: fetchImplementation = globalThis.fetch,
}: {
  baseUrl: string;
  contract: Contract;
  request: InferClientRequest<Contract>;
  authentication?: ContractClientAuthentication;
  fetch?: typeof globalThis.fetch;
}): Promise<InferClientResponse<Contract>> {
  const url = buildEndpointUrl({ baseUrl, contract, request });
  const headers = new Headers();

  if (authentication?.type === 'api-key') {
    headers.set('Authorization', `Bearer ${authentication.token}`);
  }

  let body: string | undefined;

  if (contract.body) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(request.body);
  }

  const response = await fetchImplementation(url, {
    method: contract.method,
    headers,
    body,
    credentials: authentication?.type === 'session' ? 'include' : undefined,
  });
  const endpoint = { method: contract.method, path: contract.path };
  const responseSchema = contract.responses[response.status as keyof Contract['responses']] as
    | v.GenericSchema
    | undefined;
  const errorDefinitions = contract.errors.filter(
    (errorDefinition) => errorDefinition.statusCode === response.status,
  );

  if (!responseSchema && errorDefinitions.length === 0) {
    throw new PapraContractError({
      message: `No response or error declared for status ${response.status} on ${contract.method} ${contract.path}`,
      reason: 'undeclared_status',
      endpoint,
      response,
    });
  }

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch (error) {
    throw new PapraContractError({
      message: `Invalid JSON response for status ${response.status} on ${contract.method} ${contract.path}`,
      reason: 'invalid_response_json',
      endpoint,
      response,
      cause: error,
    });
  }

  if (responseSchema) {
    const result = v.safeParse(responseSchema, responseBody);

    if (!result.success) {
      throw new PapraContractError({
        message: `Response body does not match the schema for status ${response.status} on ${contract.method} ${contract.path}`,
        reason: 'invalid_response_body',
        endpoint,
        response,
        cause: result.issues,
      });
    }

    return {
      status: response.status,
      body: result.output,
    } as InferClientResponse<Contract>;
  }

  const errorResult = v.safeParse(apiErrorResponseSchema, responseBody);

  if (!errorResult.success) {
    throw new PapraContractError({
      message: `Error response body does not match the API error schema for status ${response.status} on ${contract.method} ${contract.path}`,
      reason: 'invalid_response_body',
      endpoint,
      response,
      cause: errorResult.issues,
    });
  }

  const errorDefinition = errorDefinitions.find(
    ({ code }) => code === errorResult.output.error.code,
  );

  if (!errorDefinition) {
    throw new PapraContractError({
      message: `Error code "${errorResult.output.error.code}" is not declared for status ${response.status} on ${contract.method} ${contract.path}`,
      reason: 'undeclared_error',
      endpoint,
      response,
    });
  }

  return {
    status: response.status,
    body: errorResult.output,
  } as InferClientResponse<Contract>;
}
