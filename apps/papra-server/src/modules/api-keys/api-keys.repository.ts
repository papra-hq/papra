import type { Database } from '../app/database/database.types';
import type { Logger } from '../shared/logger/logger';
import type { ApiKeyPermissions } from './api-keys.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq, getTableColumns, inArray } from 'drizzle-orm';
import { omit, pick } from 'lodash-es';
import { organizationMembersTable, organizationsTable } from '../organizations/organizations.table';
import { createError } from '../shared/errors/errors';
import { createLogger } from '../shared/logger/logger';
import { apiKeyOrganizationsTable, apiKeysTable } from './api-keys.tables';

export type ApiKeysRepository = ReturnType<typeof createApiKeysRepository>;

export function createApiKeysRepository({ db, logger = createLogger({ namespace: 'api-keys.repository' }) }: { db: Database; logger?: Logger }) {
  return injectArguments(
    {
      saveApiKey,
      getUserApiKeys,
      deleteUserApiKey,
      getApiKeyByHash,
    },
    { db, logger },
  );
}

async function saveApiKey({
  db,
  logger,
  name,
  keyHash,
  prefix,
  permissions,
  allOrganizations,
  userId,
  organizationIds,
  expiresAt,
}: {
  db: Database;
  logger: Logger;
  name: string;
  keyHash: string;
  prefix: string;
  permissions: ApiKeyPermissions[];
  allOrganizations: boolean;
  organizationIds: string[] | undefined;
  expiresAt?: Date;
  userId: string;
}) {
  const [apiKey] = await db
    .insert(apiKeysTable)
    .values({
      name,
      keyHash,
      prefix,
      permissions,
      allOrganizations,
      userId,
      expiresAt,
    })
    .returning();

  if (!apiKey) {
    // Very unlikely to happen as the insertion should throw an issue, it's for type safety
    throw createError({
      message: 'Error while creating api key',
      code: 'api-keys.create_error',
      statusCode: 500,
      isInternal: true,
    });
  }

  if (organizationIds && organizationIds.length > 0) {
    const apiKeyId = apiKey.id;

    const organizationMembers = await db
      .select()
      .from(organizationMembersTable)
      .where(
        and(
          inArray(organizationMembersTable.organizationId, organizationIds),
          eq(organizationMembersTable.userId, userId),
        ),
      );

    if (!organizationIds.every(id => organizationMembers.some(om => om.organizationId === id))) {
      logger.warn({
        userId,
        organizationIds,
        organizationMembers: organizationMembers.map(om => pick(om, ['id', 'organizationId', 'userId', 'role'])),
      }, 'Api key created for organization that the user is not part of');
    }

    await db
      .insert(apiKeyOrganizationsTable)
      .values(
        organizationMembers.map(({ id: organizationMemberId }) => ({ apiKeyId, organizationMemberId })),
      );
  }

  return { apiKey };
}

async function getUserApiKeys({ userId, db }: { userId: string; db: Database }) {
  const apiKeys = await db
    .select({
      ...omit(getTableColumns(apiKeysTable), 'keyHash'),
    })
    .from(apiKeysTable)
    .where(
      eq(apiKeysTable.userId, userId),
    );

  const relatedOrganizations = await db
    .select({
      ...getTableColumns(organizationsTable),
      apiKeyId: apiKeyOrganizationsTable.apiKeyId,
    })
    .from(apiKeyOrganizationsTable)
    .leftJoin(organizationMembersTable, eq(apiKeyOrganizationsTable.organizationMemberId, organizationMembersTable.id))
    .leftJoin(organizationsTable, eq(organizationMembersTable.organizationId, organizationsTable.id))
    .where(
      and(
        inArray(apiKeyOrganizationsTable.apiKeyId, apiKeys.map(apiKey => apiKey.id)),
        eq(organizationMembersTable.userId, userId),
      ),
    );

  const apiKeysWithOrganizations = apiKeys.map(apiKey => ({
    ...apiKey,
    organizations: relatedOrganizations
      .filter(organization => organization.apiKeyId === apiKey.id)
      .map(({ apiKeyId: _, ...organization }) => organization),
  }));

  return {
    apiKeys: apiKeysWithOrganizations,
  };
}

async function deleteUserApiKey({ apiKeyId, userId, db }: { apiKeyId: string; userId: string; db: Database }) {
  await db
    .delete(apiKeysTable)
    .where(
      and(
        eq(apiKeysTable.id, apiKeyId),
        eq(apiKeysTable.userId, userId),
      ),
    );
}

async function getApiKeyByHash({ keyHash, db }: { keyHash: string; db: Database }) {
  const [apiKey] = await db
    .select()
    .from(apiKeysTable)
    .where(
      eq(apiKeysTable.keyHash, keyHash),
    );

  return { apiKey };
}
