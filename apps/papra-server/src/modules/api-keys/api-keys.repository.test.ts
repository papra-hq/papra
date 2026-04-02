import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import { createApiKeysRepository } from './api-keys.repository';

describe('api-keys repository', () => {
  describe('getUserApiKeys', () => {
    test('when retrieving api keys, it returns the api keys with the organizations they are linked to', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
        ],
        organizations: [
          { id: 'organization-1', name: 'Organization 1', createdAt: new Date('2021-01-01'), updatedAt: new Date('2021-01-02') },
          { id: 'organization-2', name: 'Organization 2', createdAt: new Date('2021-02-01'), updatedAt: new Date('2021-02-02') },
        ],
        organizationMembers: [
          { id: 'om-1', organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
        apiKeys: [
          { id: 'api-key-1', userId: 'user-1', name: 'API Key 1', prefix: 'ak', keyHash: 'hash1', createdAt: new Date('2021-03-01'), updatedAt: new Date('2021-03-02') },
        ],
        apiKeyOrganizations: [
          { apiKeyId: 'api-key-1', organizationMemberId: 'om-1' },
        ],
      });

      const repository = createApiKeysRepository({ db });

      const { apiKeys } = await repository.getUserApiKeys({ userId: 'user-1' });

      expect(apiKeys).to.eql([
        {
          id: 'api-key-1',
          userId: 'user-1',
          name: 'API Key 1',
          allOrganizations: false,
          prefix: 'ak',
          lastUsedAt: null,
          expiresAt: null,
          organizations: [{
            id: 'organization-1',
            name: 'Organization 1',
            customerId: null,
            createdAt: new Date('2021-01-01'),
            updatedAt: new Date('2021-01-02'),
            deletedAt: null,
            deletedBy: null,
            scheduledPurgeAt: null,
          }],
          createdAt: new Date('2021-03-01'),
          updatedAt: new Date('2021-03-02'),
          permissions: [],
        },
      ]);
    });
  });

  describe('getApiKeyByHash', () => {
    test('when retrieving an api key by hash, it only returns the api key if it is not expired', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
        ],
        apiKeys: [
          { id: 'api-key-1', userId: 'user-1', name: 'API Key 1', prefix: 'ak', keyHash: 'hash1', createdAt: new Date('2021-03-01'), updatedAt: new Date('2021-03-02'), expiresAt: new Date('2022-03-01') },
          { id: 'api-key-2', userId: 'user-1', name: 'API Key 2', prefix: 'ak', keyHash: 'hash2', createdAt: new Date('2021-03-01'), updatedAt: new Date('2021-03-02'), expiresAt: new Date('2020-03-01') },
          { id: 'api-key-3', userId: 'user-1', name: 'API Key 3', prefix: 'ak', keyHash: 'hash3', createdAt: new Date('2021-03-01'), updatedAt: new Date('2021-03-02'), expiresAt: null },
        ],
      });

      const now = new Date('2021-06-01');

      const repository = createApiKeysRepository({ db });

      const { apiKey } = await repository.getApiKeyByHash({ keyHash: 'hash1', now });
      expect(apiKey?.id).to.eql('api-key-1');

      const { apiKey: expiredApiKey } = await repository.getApiKeyByHash({ keyHash: 'hash2', now });
      expect(expiredApiKey).to.eql(undefined);

      const { apiKey: apiKeyWithoutExpiry } = await repository.getApiKeyByHash({ keyHash: 'hash3', now });
      expect(apiKeyWithoutExpiry?.id).to.eql('api-key-3');
    });
  });
});
