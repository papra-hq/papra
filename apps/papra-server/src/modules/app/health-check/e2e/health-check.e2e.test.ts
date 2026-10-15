import type { Database } from '../../database/database.types';
import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../../../config/config.test-utils';
import { createInMemoryDatabase } from '../../database/database.test-utils';
import { createServer } from '../../server';
import { createTestServerDependencies } from '../../server.test-utils';

describe('health check routes e2e', () => {
  describe('health check', () => {
    describe('the /api/health is a publicly accessible route that provides health information about the server', () => {
      test('when the database is healthy, the /api/health returns 200', async () => {
        const { db } = await createInMemoryDatabase();
        const { app } = createServer(
          createTestServerDependencies({ db, config: overrideConfig() }),
        );

        const response = await app.request('/api/health');

        const body = await response.json();

        expect(response.status).toEqual(200);
        expect(response.headers.get('Content-Type')).toEqual('application/json');
        expect(body).toEqual({
          isDatabaseHealthy: true,
          isEverythingOk: true,
          status: 'ok',
        });
      });

      test('when their is an issue with the database, the /api/health returns a 500', async () => {
        const db = {
          run: async () => {
            throw new Error('Alerte générale !');
          },
        } as unknown as Database;

        const { app } = createServer(
          createTestServerDependencies({ db, config: overrideConfig() }),
        );

        const response = await app.request('/api/health');

        const body = await response.json();

        expect(response.status).toEqual(500);
        expect(response.headers.get('Content-Type')).toEqual('application/json');
        expect(body).toEqual({
          isDatabaseHealthy: false,
          isEverythingOk: false,
          status: 'error',
        });
      });
    });
  });
});
