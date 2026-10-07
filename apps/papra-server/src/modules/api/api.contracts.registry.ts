import { getCurrentUserContract, updateCurrentUserContract } from '../users/users.api.contracts';

export const apiContracts = {
  getCurrentUser: getCurrentUserContract,
  updateCurrentUser: updateCurrentUserContract,
};
