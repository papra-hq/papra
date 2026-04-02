import type { Database } from '../../app/database/database.types';
import { getTableColumns } from 'drizzle-orm';
import { pick } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { CUSTOM_PROPERTY_TYPES } from '../custom-properties.constants';
import { createCustomPropertySelectOptionUnknownIdError } from './custom-properties-options.errors';
import { createCustomPropertiesOptionsRepository } from './custom-properties-options.repository';
import { customPropertySelectOptionsTable } from './custom-properties-options.table';

async function getOptions({ db, withId = true }: { db: Database; withId?: boolean }) {
  return db
    .select({
      ...pick(
        getTableColumns(customPropertySelectOptionsTable),
        [...(withId ? ['id'] : []), 'propertyDefinitionId', 'name', 'key', 'displayOrder'],
      ),
    })
    .from(customPropertySelectOptionsTable);
}

describe('custom-properties-options repository', () => {
  describe('syncSelectOptions', () => {
    test('creates new options when none exist', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_111111111111111111111111', name: 'Test Org' }],
        customPropertyDefinitions: [{
          id: 'cpd_111111111111111111111111',
          organizationId: 'org_111111111111111111111111',
          name: 'Status',
          type: CUSTOM_PROPERTY_TYPES.SELECT,
          key: 'status',
        }],
      });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      expect(await getOptions({ db })).to.eql([]);

      await customPropertiesOptionsRepository.syncSelectOptions({
        propertyDefinitionId: 'cpd_111111111111111111111111',
        options: [{ name: 'Open' }, { name: 'Closed' }],
      });

      expect(
        await getOptions({ db, withId: false }),
      ).to.eql([
        { propertyDefinitionId: 'cpd_111111111111111111111111', name: 'Open', key: 'open', displayOrder: 0 },
        { propertyDefinitionId: 'cpd_111111111111111111111111', name: 'Closed', key: 'closed', displayOrder: 1 },
      ]);
    });

    test('assigns displayOrder based on array position', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_111111111111111111111111', name: 'Test Org' }],
        customPropertyDefinitions: [{
          id: 'cpd_111111111111111111111111',
          organizationId: 'org_111111111111111111111111',
          name: 'Status',
          type: CUSTOM_PROPERTY_TYPES.SELECT,
          key: 'status',
        }],
      });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await customPropertiesOptionsRepository.syncSelectOptions({
        propertyDefinitionId: 'cpd_111111111111111111111111',
        options: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      });

      expect(
        await getOptions({ db, withId: false }),
      ).to.eql([
        { propertyDefinitionId: 'cpd_111111111111111111111111', name: 'A', key: 'a', displayOrder: 0 },
        { propertyDefinitionId: 'cpd_111111111111111111111111', name: 'B', key: 'b', displayOrder: 1 },
        { propertyDefinitionId: 'cpd_111111111111111111111111', name: 'C', key: 'c', displayOrder: 2 },
      ]);
    });

    test('updates existing options by ID', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_111111111111111111111111', name: 'Test Org' }],
        customPropertyDefinitions: [{
          id: 'cpd_111111111111111111111111',
          organizationId: 'org_111111111111111111111111',
          name: 'Status',
          type: CUSTOM_PROPERTY_TYPES.SELECT,
          key: 'status',
        }],
        customPropertySelectOptions: [{
          id: 'cso_111111111111111111111111',
          propertyDefinitionId: 'cpd_111111111111111111111111',
          name: 'Draft',
          key: 'draft',
          displayOrder: 0,
        }],
      });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await customPropertiesOptionsRepository.syncSelectOptions({
        propertyDefinitionId: 'cpd_111111111111111111111111',
        options: [{ id: 'cso_111111111111111111111111', name: 'Published' }],
      });

      expect(
        await getOptions({ db }),
      ).to.eql([
        { id: 'cso_111111111111111111111111', propertyDefinitionId: 'cpd_111111111111111111111111', name: 'Published', key: 'published', displayOrder: 0 },
      ]);
    });

    test('deletes options omitted from the incoming list', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_111111111111111111111111', name: 'Test Org' }],
        customPropertyDefinitions: [{
          id: 'cpd_111111111111111111111111',
          organizationId: 'org_111111111111111111111111',
          name: 'Status',
          type: CUSTOM_PROPERTY_TYPES.SELECT,
          key: 'status',
        }],
        customPropertySelectOptions: [
          { id: 'cso_111111111111111111111111', propertyDefinitionId: 'cpd_111111111111111111111111', name: 'Keep', key: 'keep', displayOrder: 0 },
          { id: 'cso_222222222222222222222222', propertyDefinitionId: 'cpd_111111111111111111111111', name: 'Remove', key: 'remove', displayOrder: 1 },
        ],
      });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await customPropertiesOptionsRepository.syncSelectOptions({
        propertyDefinitionId: 'cpd_111111111111111111111111',
        options: [{ id: 'cso_111111111111111111111111', name: 'Keep' }],
      });

      expect(
        await getOptions({ db, withId: false }),
      ).to.eql([
        { propertyDefinitionId: 'cpd_111111111111111111111111', name: 'Keep', key: 'keep', displayOrder: 0 },
      ]);
    });

    test('handles mixed create, update, and delete in one call', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_111111111111111111111111', name: 'Test Org' }],
        customPropertyDefinitions: [{
          id: 'cpd_111111111111111111111111',
          organizationId: 'org_111111111111111111111111',
          name: 'Status',
          type: CUSTOM_PROPERTY_TYPES.SELECT,
          key: 'status',
        }],
        customPropertySelectOptions: [
          { id: 'cso_111111111111111111111111', propertyDefinitionId: 'cpd_111111111111111111111111', name: 'Old', key: 'old', displayOrder: 0 },
          { id: 'cso_222222222222222222222222', propertyDefinitionId: 'cpd_111111111111111111111111', name: 'ToDelete', key: 'todelete', displayOrder: 1 },
        ],
      });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await customPropertiesOptionsRepository.syncSelectOptions({
        propertyDefinitionId: 'cpd_111111111111111111111111',
        options: [{ id: 'cso_111111111111111111111111', name: 'Updated' }, { name: 'New' }],
      });

      expect(
        await getOptions({ db, withId: false }),
      ).to.eql([
        { propertyDefinitionId: 'cpd_111111111111111111111111', name: 'Updated', key: 'updated', displayOrder: 0 },
        { propertyDefinitionId: 'cpd_111111111111111111111111', name: 'New', key: 'new', displayOrder: 1 },
      ]);
    });

    test('is a no-op when the incoming list is empty and there are no existing options', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_111111111111111111111111', name: 'Test Org' }],
        customPropertyDefinitions: [{
          id: 'cpd_111111111111111111111111',
          organizationId: 'org_111111111111111111111111',
          name: 'Status',
          type: CUSTOM_PROPERTY_TYPES.SELECT,
          key: 'status',
        }],
      });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await customPropertiesOptionsRepository.syncSelectOptions({
        propertyDefinitionId: 'cpd_111111111111111111111111',
        options: [],
      });

      expect(await getOptions({ db })).to.eql([]);
    });

    test('deletes all options when an empty list is provided', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_111111111111111111111111', name: 'Test Org' }],
        customPropertyDefinitions: [{
          id: 'cpd_111111111111111111111111',
          organizationId: 'org_111111111111111111111111',
          name: 'Status',
          type: CUSTOM_PROPERTY_TYPES.SELECT,
          key: 'status',
        }],
        customPropertySelectOptions: [
          { id: 'cso_111111111111111111111111', propertyDefinitionId: 'cpd_111111111111111111111111', name: 'A', key: 'a', displayOrder: 0 },
          { id: 'cso_222222222222222222222222', propertyDefinitionId: 'cpd_111111111111111111111111', name: 'B', key: 'b', displayOrder: 1 },
        ],
      });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await customPropertiesOptionsRepository.syncSelectOptions({
        propertyDefinitionId: 'cpd_111111111111111111111111',
        options: [],
      });

      expect(await getOptions({ db })).to.eql([]);
    });

    test('throws when an unknown option ID is provided', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_111111111111111111111111', name: 'Test Org' }],
        customPropertyDefinitions: [{
          id: 'cpd_111111111111111111111111',
          organizationId: 'org_111111111111111111111111',
          name: 'Status',
          type: CUSTOM_PROPERTY_TYPES.SELECT,
          key: 'status',
        }],
      });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await expect(
        customPropertiesOptionsRepository.syncSelectOptions({
          propertyDefinitionId: 'cpd_111111111111111111111111',
          options: [{ id: 'cso_nonexistent000000000000000', name: 'Ghost' }],
        }),
      ).rejects.toThrow(createCustomPropertySelectOptionUnknownIdError());
    });

    test('does not wipe existing options when a foreign ID is provided', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_111111111111111111111111', name: 'Test Org' }],
        customPropertyDefinitions: [{
          id: 'cpd_111111111111111111111111',
          organizationId: 'org_111111111111111111111111',
          name: 'Status',
          type: CUSTOM_PROPERTY_TYPES.SELECT,
          key: 'status',
        }],
        customPropertySelectOptions: [
          { id: 'cso_111111111111111111111111', propertyDefinitionId: 'cpd_111111111111111111111111', name: 'Safe', key: 'safe', displayOrder: 0 },
        ],
      });
      const customPropertiesOptionsRepository = createCustomPropertiesOptionsRepository({ db });

      await expect(
        customPropertiesOptionsRepository.syncSelectOptions({
          propertyDefinitionId: 'cpd_111111111111111111111111',
          options: [{ id: 'cso_nonexistent000000000000000', name: 'Attacker' }],
        }),
      ).rejects.toThrow(createCustomPropertySelectOptionUnknownIdError());

      expect(
        await getOptions({ db, withId: false }),
      ).to.eql([
        { propertyDefinitionId: 'cpd_111111111111111111111111', name: 'Safe', key: 'safe', displayOrder: 0 },
      ]);
    });
  });
});
