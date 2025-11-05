import type { DatabaseClient } from '../app/database/database.types';
import type { Logger } from '../shared/logger/logger';
import type { ApiKeyPermissions } from './api-keys.types';
import { injectArguments } from '@corentinth/chisels';
import { pick } from 'lodash-es';
import { dbToOrganizationMember } from '../organizations/organizations.models';
import { createError } from '../shared/errors/errors';
import { createLogger } from '../shared/logger/logger';
import { apiKeyOrganizationToDb, apiKeyToDb, dbToApiKey } from './api-keys.models';

export type ApiKeysRepository = ReturnType<typeof createApiKeysRepository>;

export function createApiKeysRepository({ db, logger = createLogger({ namespace: 'api-keys.repository' }) }: { db: DatabaseClient; logger?: Logger }) {
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
  db: DatabaseClient;
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
  const dbApiKey = await db
    .insertInto('api_keys')
    .values(apiKeyToDb({
      name,
      keyHash,
      prefix,
      permissions,
      allOrganizations,
      userId,
      expiresAt,
    }))
    .returningAll()
    .executeTakeFirst();

  if (!dbApiKey) {
    // Very unlikely to happen as the insertion should throw an issue, it's for type safety
    throw createError({
      message: 'Error while creating api key',
      code: 'api-keys.create_error',
      statusCode: 500,
      isInternal: true,
    });
  }

  const apiKey = dbToApiKey(dbApiKey);

  if (organizationIds && organizationIds.length > 0) {
    const apiKeyId = apiKey.id;

    const dbOrganizationMembers = await db
      .selectFrom('organization_members')
      .where('organization_id', 'in', organizationIds)
      .where('user_id', '=', userId)
      .selectAll()
      .execute();

    const organizationMembers = dbOrganizationMembers.map(dbOm => (dbToOrganizationMember(dbOm)));

    if (!organizationIds.every(id => organizationMembers.some(om => om.organizationId === id))) {
      logger.warn({
        userId,
        organizationIds,
        organizationMembers: organizationMembers.map(om => pick(om, ['id', 'organizationId', 'userId', 'role'])),
      }, 'Api key created for organization that the user is not part of');
    }

    await db
      .insertInto('api_key_organizations')
      .values(
        organizationMembers.map(({ id: organizationMemberId }) => apiKeyOrganizationToDb({ apiKeyId, organizationMemberId })),
      )
      .execute();
  }

  return { apiKey };
}

async function getUserApiKeys({ userId, db }: { userId: string; db: DatabaseClient }) {
  const dbApiKeys = await db
    .selectFrom('api_keys')
    .where('user_id', '=', userId)
    .select(['api_keys.id', 'api_keys.user_id', 'api_keys.name', 'api_keys.prefix', 'api_keys.last_used_at', 'api_keys.expires_at', 'api_keys.permissions', 'api_keys.all_organizations', 'api_keys.created_at', 'api_keys.updated_at'])
    .execute()
    .then(rows => rows.map(row => dbToApiKey(row)));

  const relatedOrganizations = await db
    .selectFrom('api_key_organizations')
    .innerJoin('organization_members', 'api_key_organizations.organization_member_id', 'organization_members.id')
    .innerJoin('organizations', 'organization_members.organization_id', 'organizations.id')
    .where('api_key_organizations.api_key_id', 'in', dbApiKeys.map(apiKey => apiKey.id))
    .where('organization_members.user_id', '=', userId)
    .select([
      'organizations.id',
      'organizations.name',
      'organizations.customer_id',
      'organizations.deleted_at',
      'organizations.deleted_by',
      'organizations.scheduled_purge_at',
      'organizations.created_at',
      'organizations.updated_at',
      'api_key_organizations.api_key_id as apiKeyId',
    ])
    .execute();

  const apiKeysWithOrganizations = dbApiKeys.map(apiKey => ({
    ...apiKey,
    organizations: relatedOrganizations
      .filter(organization => organization.apiKeyId === apiKey.id)
      .map(({ apiKeyId: _, ...organization }) => organization),
  }));

  return {
    apiKeys: apiKeysWithOrganizations,
  };
}

async function deleteUserApiKey({ apiKeyId, userId, db }: { apiKeyId: string; userId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('api_keys')
    .where('id', '=', apiKeyId)
    .where('user_id', '=', userId)
    .execute();
}

async function getApiKeyByHash({ keyHash, db }: { keyHash: string; db: DatabaseClient }) {
  const dbApiKey = await db
    .selectFrom('api_keys')
    .where('key_hash', '=', keyHash)
    .selectAll()
    .executeTakeFirst();

  const apiKey = dbApiKey ? dbToApiKey(dbApiKey) : undefined;

  return { apiKey };
}
