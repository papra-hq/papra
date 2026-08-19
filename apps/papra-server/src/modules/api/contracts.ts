import {
  getCurrentUserEndpointContract,
  updateCurrentUserEndpointContract,
} from '../users/users.routes.contract';

export const apiContract = {
  users: {
    getCurrentUser: getCurrentUserEndpointContract,
    updateCurrentUser: updateCurrentUserEndpointContract,
  },
} as const;
