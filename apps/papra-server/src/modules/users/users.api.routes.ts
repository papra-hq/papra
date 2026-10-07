import { defineApiRoute } from '../api/api.routes';
import type { GlobalDependencies } from '../app/server.types';
import { getCurrentUserContract } from './users.api.contracts';

export function setupGetCurrentUserRoute(_deps: GlobalDependencies) {
  return defineApiRoute({
    contract: getCurrentUserContract,
    handler: async () => {
      return {
        status: 200,
        contentType: 'application/json',
        body: {
          user: {
            id: '1',
            email: 'alice@example.com',
            name: 'Alice',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            twoFactorEnabled: false,
            permissions: [],
          },
        },
      };
    },
  });
}
