import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../../../config/config.test-utils';
import { createInMemoryDatabase } from '../../database/database.test-utils';
import { createServer } from '../../server';
import { createTestServerDependencies } from '../../server.test-utils';

describe('ping routes e2e', () => {
  test('the /api/ping is a publicly accessible route that always returns a 200 with a status ok', async () => {
    const { db } = await createInMemoryDatabase();
    const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig() }));

    const response = await app.request('/api/ping');

    expect(response.status).to.eql(200);
    expect(await response.json()).to.eql({
      status: 'ok',
    });
  });
});
