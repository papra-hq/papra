import { injectArguments } from '@corentinth/chisels';
import type { Database } from '../../app/database/database.types';
import { organizationSettingsTable } from './organization-settings.tables';
import { eq } from 'drizzle-orm';
import type { DbUpdatableOrganizationSettings } from './organization-settings.types';
import { omitUndefined } from '../../shared/objects';
import { createError } from '../../shared/errors/errors';
import { systemClock } from '../../shared/clock/clock';
import type { Clock } from '../../shared/clock/clock.types';

export type OrganizationSettingsRepository = ReturnType<
  typeof createOrganizationSettingsRepository
>;

export function createOrganizationSettingsRepository({
  db,
  clock = systemClock,
}: {
  db: Database;
  clock?: Clock;
}) {
  return injectArguments(
    { getOrganizationSettings, createOrUpdateOrganizationSettings },
    { db, clock },
  );
}

async function getOrganizationSettings({
  organizationId,
  db,
}: {
  organizationId: string;
  db: Database;
}) {
  const organizationSettings = await db
    .select()
    .from(organizationSettingsTable)
    .where(eq(organizationSettingsTable.organizationId, organizationId));

  const [settings] = organizationSettings;

  return {
    organizationRawSettings: settings,
  };
}

async function createOrUpdateOrganizationSettings({
  organizationId,
  settings,
  db,
  clock,
}: {
  organizationId: string;
  settings: DbUpdatableOrganizationSettings;
  db: Database;
  clock: Clock;
}) {
  const cleanedSettings = omitUndefined(settings);
  const now = new Date(clock.now().epochMilliseconds); // Drizzle forces to use date object

  const existingSettings = await db
    .insert(organizationSettingsTable)
    .values({
      organizationId,
      ...cleanedSettings,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: organizationSettingsTable.organizationId,
      set: {
        ...cleanedSettings,
        updatedAt: now,
      },
    })
    .returning();

  const [updatedSettings] = existingSettings;

  if (!updatedSettings) {
    // Should never happen, but for type safety
    throw createError({
      code: 'organization_settings.update_failed',
      message: 'Failed to create or update organization settings',
      statusCode: 500,
      isInternal: true,
    });
  }

  return {
    organizationSettings: updatedSettings,
  };
}
