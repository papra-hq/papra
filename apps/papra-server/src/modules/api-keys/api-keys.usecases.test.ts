import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createApiKeysRepository } from './api-keys.repository';
import { createApiKey, getApiKey } from './api-keys.usecases';

describe('api-keys usecases', () => {
  describe('createApiKey', () => {
    test('the api key is created with the correct hash', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user_1', email: 'test@test.com' },
        ],
      });
      const apiKeyRepository = createApiKeysRepository({ db });

      const { apiKey, token } = await createApiKey({
        name: 'test',
        userId: 'user_1',
        permissions: ['documents:create'],
        organizationIds: [],
        allOrganizations: false,
        apiKeyRepository,
        generateApiToken: () => ({ token: 'ppapi_HT2Hj5V8A3WHMQtVcMDB9UucqUxPU15o1aI6qOc1Oy5qBvbSEr4jZzsjuFYPqCP0' }),
      });

      expect(apiKey).to.deep.include({
        name: 'test',
        permissions: ['documents:create'],
        keyHash: 'ExkPP3tmeg55u7ObhGuMOywnfkbLVGYE2VBxMj8koB4',
        userId: 'user_1',
        prefix: 'ppapi_HT2Hj',
      });
      expect(token).to.eql('ppapi_HT2Hj5V8A3WHMQtVcMDB9UucqUxPU15o1aI6qOc1Oy5qBvbSEr4jZzsjuFYPqCP0');
    });
  });

  describe('getApiKey', () => {
    test('an api key can be retrieved by its token', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user_1', email: 'test@test.com' },
        ],
        apiKeys: [
          { id: 'api_key_1', keyHash: 'ExkPP3tmeg55u7ObhGuMOywnfkbLVGYE2VBxMj8koB4', userId: 'user_1', prefix: 'ppapi_HT2Hj', name: 'test' },
        ],
      });
      const apiKeyRepository = createApiKeysRepository({ db });

      const { apiKey } = await getApiKey({ token: 'ppapi_HT2Hj5V8A3WHMQtVcMDB9UucqUxPU15o1aI6qOc1Oy5qBvbSEr4jZzsjuFYPqCP0', apiKeyRepository });

      expect(apiKey.id).to.eql('api_key_1');
    });
  });
});
