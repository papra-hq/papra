import {
  getCurrentUserEndpointContract,
  updateCurrentUserEndpointContract,
} from '../users/users.routes.contract';

export const apiContract = {
  getCurrentUser: getCurrentUserEndpointContract,
  updateCurrentUser: updateCurrentUserEndpointContract,
} as const;
