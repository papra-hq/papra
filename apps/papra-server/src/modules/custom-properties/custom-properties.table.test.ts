import { safely } from '@corentinth/chisels';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { isUniqueConstraintError } from '../shared/db/constraints.models';
import { customPropertyDefinitionsTable } from './custom-properties.table';

describe('custom properties table', () => {
  describe('custom property definitions table', () => {
    test('in a same organization, two definitions cannot have the same name', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_111111111111111111111111', name: 'Test Org' },
          { id: 'org_222222222222222222222222', name: 'Other Org' },
        ],
      });

      await db.insert(customPropertyDefinitionsTable).values({
        organizationId: 'org_111111111111111111111111',
        name: 'Definition 1',
        key: 'definition-1',
        type: 'text',
      });

      const [value, error] = await safely(db.insert(customPropertyDefinitionsTable).values({
        organizationId: 'org_111111111111111111111111',
        name: 'Definition 1',
        key: 'other-key',
        type: 'text',
      }));

      expect(value).to.eql(null);
      expect(isUniqueConstraintError({ error })).to.eql(true);

      // But we can have the same definition name in another organization
      await db.insert(customPropertyDefinitionsTable).values({
        organizationId: 'org_222222222222222222222222',
        name: 'Definition 1',
        key: 'definition-1',
        type: 'text',
      });
    });

    test('in a same organization, two definitions cannot have the same key', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_111111111111111111111111', name: 'Test Org' },
          { id: 'org_222222222222222222222222', name: 'Other Org' },
        ],
      });

      await db.insert(customPropertyDefinitionsTable).values({
        organizationId: 'org_111111111111111111111111',
        name: 'Definition 1',
        key: 'definition-1',
        type: 'text',
      });

      const [value, error] = await safely(db.insert(customPropertyDefinitionsTable).values({
        organizationId: 'org_111111111111111111111111',
        name: 'Other Name',
        key: 'definition-1',
        type: 'text',
      }));

      expect(value).to.eql(null);
      expect(isUniqueConstraintError({ error })).to.eql(true);

      // But we can have the same definition key in another organization
      await db.insert(customPropertyDefinitionsTable).values({
        organizationId: 'org_222222222222222222222222',
        name: 'Definition 1',
        key: 'definition-1',
        type: 'text',
      });
    });
  });
});
