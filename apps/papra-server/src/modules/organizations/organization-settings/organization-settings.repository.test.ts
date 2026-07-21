import { describe, expect, test } from 'vitest';
import { createOrganizationSettingsRepository } from './organization-settings.repository';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { getTableColumns } from 'drizzle-orm';
import { organizationSettingsTable } from './organization-settings.tables';
import { pick } from '../../shared/objects';
import { createTestClock } from '../../shared/clock/clock.test-utils';

describe('organization-settings.repository', () => {
  describe('createOrUpdateOrganizationSettings', () => {
    test('when called with valid settings, it should create or update the organization settings', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
      });

      const repository = createOrganizationSettingsRepository({ db });

      await repository.createOrUpdateOrganizationSettings({
        organizationId: 'org_1',
        _settings: {
          aiAutoTaggingEnabled: true,
        },
      });

      expect(
        await db
          .select(
            pick(getTableColumns(organizationSettingsTable), [
              'organizationId',
              'aiAutoTaggingEnabled',
              'aiAutoTaggingCanCreateNewTags',
              'aiAutoTaggingMaxTags',
            ]),
          )
          .from(organizationSettingsTable),
      ).to.eql([
        {
          organizationId: 'org_1',
          aiAutoTaggingEnabled: true,
          aiAutoTaggingCanCreateNewTags: null,
          aiAutoTaggingMaxTags: null,
        },
      ]);

      await repository.createOrUpdateOrganizationSettings({
        organizationId: 'org_1',
        _settings: {
          aiAutoTaggingEnabled: false,
          aiAutoTaggingCanCreateNewTags: true,
          aiAutoTaggingMaxTags: 5,
        },
      });

      expect(
        await db
          .select(
            pick(getTableColumns(organizationSettingsTable), [
              'organizationId',
              'aiAutoTaggingEnabled',
              'aiAutoTaggingCanCreateNewTags',
              'aiAutoTaggingMaxTags',
            ]),
          )
          .from(organizationSettingsTable),
      ).to.eql([
        {
          organizationId: 'org_1',
          aiAutoTaggingEnabled: false,
          aiAutoTaggingCanCreateNewTags: true,
          aiAutoTaggingMaxTags: 5,
        },
      ]);
    });

    test('when updating existing settings, the updatedAt timestamp should be updated', async () => {
      const { clock } = createTestClock({ now: '2026-05-12T12:00:00Z' });

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
      });

      const repository = createOrganizationSettingsRepository({ db, clock });

      await repository.createOrUpdateOrganizationSettings({
        organizationId: 'org_1',
        _settings: {
          aiAutoTaggingEnabled: true,
        },
      });

      const [initialSettings] = await db.select().from(organizationSettingsTable);

      expect(initialSettings?.createdAt).to.eql(new Date('2026-05-12T12:00:00Z'));
      expect(initialSettings?.updatedAt).to.eql(new Date('2026-05-12T12:00:00Z'));

      clock.advanceBy({ hours: 1 });

      await repository.createOrUpdateOrganizationSettings({
        organizationId: 'org_1',
        _settings: {
          aiAutoTaggingEnabled: false,
        },
      });

      const [updatedSettings] = await db.select().from(organizationSettingsTable);

      expect(updatedSettings?.createdAt).to.eql(new Date('2026-05-12T12:00:00Z'));
      expect(updatedSettings?.updatedAt).to.eql(new Date('2026-05-12T13:00:00Z'));
    });
  });
});
