import type { EndpointContract } from './contracts.types';

export function defineEndpointContract<const Contract extends EndpointContract>(
  contract: Contract,
): Contract {
  return contract;
}
