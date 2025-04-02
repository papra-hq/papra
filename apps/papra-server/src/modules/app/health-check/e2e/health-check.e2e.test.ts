import type { Database } from '../../database/database.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../database/database.test-utils';
import { createServer } from '../../server';

describe('health check routes e2e', () => {
  describe('health check', () => {
    describe('the /api/health is a publicly accessible route that provides health information about the server', () => {
      test('when the database is healthy, the /api/health returns 200', async () => {
        const { db } = await createInMemoryDatabase();
        const { app } = await createServer({ db });

        const response = await app.request('/api/health');

        expect(response.status).to.eql(200);
        expect(await response.json()).to.eql({
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

        const { app } = await createServer({ db });

        const response = await app.request('/api/health');

        expect(response.status).to.eql(500);
        expect(
          await response.json(),
        ).to.eql({
          isDatabaseHealthy: false,
          isEverythingOk: false,
          status: 'error',
        });
      });
    });
  });
});
