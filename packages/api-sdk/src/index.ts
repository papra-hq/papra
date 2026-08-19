export { apiContract } from '@papra/app-server/api/contracts';
export { createClient, PAPRA_API_URL } from './api-client';
export { callEndpoint, createApiClient } from './contract-client';
export { PapraContractError } from './contract-client.errors';
export { buildEndpointUrl } from './endpoint-url';

export type { Client } from './api-client';
export type {
  ApiClient,
  ContractClientAuthentication,
  CreateApiClientOptions,
} from './contract-client';
export type { PapraContractErrorReason } from './contract-client.errors';
export type {
  EndpointContract,
  InferClientErrorResponse,
  InferClientRequest,
  InferClientResponse,
} from '@papra/app-server/api/contracts/types';
