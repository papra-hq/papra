export { apiContract } from '@papra/app-server/api/contracts';
export { createClient, PAPRA_API_URL } from './api-client';
export { callEndpoint } from './contract-client';
export { buildEndpointUrl } from './endpoint-url';

export type { Client } from './api-client';
export type { ContractClientAuthentication } from './contract-client';
export type {
  EndpointContract,
  InferClientRequest,
  InferClientResponse,
} from '@papra/app-server/api/contracts/types';
