import type {
  ApiKey,
  ApiKeyOrganization,
  DbInsertableApiKey,
  DbInsertableApiKeyOrganization,
  DbSelectableApiKey,
  DbSelectableApiKeyOrganization,
  InsertableApiKey,
  InsertableApiKeyOrganization,
} from './api-keys.new.tables';
import { sha256 } from '../shared/crypto/hash';
import { generateId } from '../shared/random/ids';
import { isNil } from '../shared/utils';
import { API_KEY_ID_PREFIX, API_KEY_PREFIX, API_KEY_TOKEN_REGEX } from './api-keys.constants';
import { apiPermissionsSchema } from './api-keys.schemas';

const generateApiKeyId = () => generateId({ prefix: API_KEY_ID_PREFIX });

export function getApiKeyUiPrefix({ token }: { token: string }) {
  return {
    prefix: token.slice(0, 5 + API_KEY_PREFIX.length + 1),
  };
}

export function getApiKeyHash({ token }: { token: string }) {
  return {
    keyHash: sha256(token, { digest: 'base64url' }),
  };
}

// Positional argument as TS does not like named argument with type guards
export function looksLikeAnApiKey(token?: string | null | undefined): token is string {
  if (isNil(token)) {
    return false;
  }

  return API_KEY_TOKEN_REGEX.test(token);
}

// DB <-> Business model transformers

export function dbToApiKey(dbApiKey: Omit<DbSelectableApiKey, 'key_hash'>): Omit<ApiKey, 'keyHash'>;
export function dbToApiKey(dbApiKey: DbSelectableApiKey): ApiKey;
export function dbToApiKey(dbApiKey?: DbSelectableApiKey | Omit<DbSelectableApiKey, 'key_hash'>): ApiKey | undefined | Omit<ApiKey, 'keyHash'> {
  if (!dbApiKey) {
    return undefined;
  }

  return {
    id: dbApiKey.id,
    name: dbApiKey.name,
    ...('key_hash' in dbApiKey ? { keyHash: dbApiKey.key_hash } : {}),
    prefix: dbApiKey.prefix,
    userId: dbApiKey.user_id,
    permissions: apiPermissionsSchema.parse(dbApiKey.permissions),
    allOrganizations: dbApiKey.all_organizations === 1,
    createdAt: new Date(dbApiKey.created_at),
    updatedAt: new Date(dbApiKey.updated_at),
    lastUsedAt: isNil(dbApiKey.last_used_at) ? null : new Date(dbApiKey.last_used_at),
    expiresAt: isNil(dbApiKey.expires_at) ? null : new Date(dbApiKey.expires_at),
  };
}

export function apiKeyToDb(
  apiKey: InsertableApiKey,
  {
    now = new Date(),
    generateId = generateApiKeyId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableApiKey {
  return {
    id: apiKey.id ?? generateId(),
    name: apiKey.name,
    key_hash: apiKey.keyHash,
    prefix: apiKey.prefix,
    user_id: apiKey.userId,
    permissions: JSON.stringify(apiKey.permissions ?? []),
    all_organizations: apiKey.allOrganizations === true ? 1 : 0,
    created_at: apiKey.createdAt?.getTime() ?? now.getTime(),
    updated_at: apiKey.updatedAt?.getTime() ?? now.getTime(),
    last_used_at: apiKey.lastUsedAt?.getTime(),
    expires_at: apiKey.expiresAt?.getTime(),
  };
}

// API Key Organizations junction table transformers

export function dbToApiKeyOrganization(dbApiKeyOrg?: DbSelectableApiKeyOrganization): ApiKeyOrganization | undefined {
  if (!dbApiKeyOrg) {
    return undefined;
  }

  return {
    apiKeyId: dbApiKeyOrg.api_key_id,
    organizationMemberId: dbApiKeyOrg.organization_member_id,
  };
}

export function apiKeyOrganizationToDb(apiKeyOrg: InsertableApiKeyOrganization): DbInsertableApiKeyOrganization {
  return {
    api_key_id: apiKeyOrg.apiKeyId,
    organization_member_id: apiKeyOrg.organizationMemberId,
  };
}
