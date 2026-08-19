import type {
  EndpointContract,
  InferClientRequest,
  InferClientResponse,
} from '@papra/app-server/api/contracts/types';
import * as v from 'valibot';
import { buildEndpointUrl } from './endpoint-url';

export type ContractClientAuthentication = { type: 'api-key'; token: string } | { type: 'session' };

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
  const responseSchema = contract.responses[response.status as keyof Contract['responses']] as
    | v.GenericSchema
    | undefined;

  if (!responseSchema) {
    throw new Error(
      `No response schema declared for status ${response.status} on ${contract.method} ${contract.path}`,
    );
  }

  const responseBody: unknown = await response.json();
  const parsedBody = v.parse(responseSchema, responseBody);

  return {
    status: response.status,
    body: parsedBody,
  } as InferClientResponse<Contract>;
}
