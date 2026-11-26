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

    const body = await response.json();

    expect(response.status).toEqual(200);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(body).toEqual({ status: 'ok' });
  });

  test('HEAD requests to /api/ping are public and return no body', async () => {
    const { db } = await createInMemoryDatabase();
    const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig() }));

    const response = await app.request('/api/ping', { method: 'HEAD' });

    expect(response.status).toEqual(200);
    expect(response.headers.get('Content-Type')).toEqual('application/json');
    expect(response.body).toEqual(null);
  });
});
