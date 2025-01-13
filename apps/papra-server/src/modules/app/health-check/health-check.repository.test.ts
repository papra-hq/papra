import type { Database } from '../database/database.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../database/database.test-utils';
import { isDatabaseHealthy } from './health-check.repository';

const faultyDatabase = {
  run: async () => {
    throw new Error('Alerte générale !');
  },
} as unknown as Database;

describe('health-check repository', () => {
  describe('isDatabaseHealthy', () => {
    test('when the database is healthy, it returns true', async () => {
      const { db } = await createInMemoryDatabase();

      expect(await isDatabaseHealthy({ db })).toBe(true);
      expect(await isDatabaseHealthy({ db: faultyDatabase })).toBe(false);
    });
  });
});
