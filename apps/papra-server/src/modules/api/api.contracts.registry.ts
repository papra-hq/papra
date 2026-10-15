import { healthCheckContract, pingContract } from '../app/health-check/health-check.api.contracts';
import { getCurrentUserContract, updateCurrentUserContract } from '../users/users.api.contracts';

export type { ApiContract } from './api.contracts';

export const apiContracts = {
  ping: pingContract,
  healthCheck: healthCheckContract,
  getCurrentUser: getCurrentUserContract,
  updateCurrentUser: updateCurrentUserContract,
};
