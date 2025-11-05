import type { ApiKey, ApiKeyPermissions } from '../../api-keys/api-keys.types';
import type { Config } from '../../config/config.types';
import type { Context } from '../server.types';
import type {
  AuthAccount,
  AuthSession,
  AuthVerification,
  DbInsertableAuthAccount,
  DbInsertableAuthSession,
  DbInsertableAuthVerification,
  DbSelectableAuthAccount,
  DbSelectableAuthSession,
  DbSelectableAuthVerification,
  InsertableAuthAccount,
  InsertableAuthSession,
  InsertableAuthVerification,
} from './auth.new.tables';
import type { Session } from './auth.types';
import { uniq } from 'lodash-es';
import { getClientBaseUrl } from '../../config/config.models';
import { createError } from '../../shared/errors/errors';
import { generateId } from '../../shared/random/ids';
import { isNil } from '../../shared/utils';

const authSessionIdPrefix = 'auth_ses';
const authAccountIdPrefix = 'auth_acc';
const authVerificationIdPrefix = 'auth_ver';

const generateAuthSessionId = () => generateId({ prefix: authSessionIdPrefix });
const generateAuthAccountId = () => generateId({ prefix: authAccountIdPrefix });
const generateAuthVerificationId = () => generateId({ prefix: authVerificationIdPrefix });

export function getUser({ context }: { context: Context }) {
  const userId = context.get('userId');

  if (isNil(userId)) {
    // This should never happen as getUser is called in authenticated routes
    // just for proper type safety
    throw createError({
      message: 'User not found in context',
      code: 'users.not_found',
      statusCode: 403,
      isInternal: true,
    });
  }

  return {
    userId,
  };
}

export function getSession({ context }: { context: Context }) {
  const session = context.get('session');

  return { session };
}

export function getTrustedOrigins({ config }: { config: Config }) {
  const { clientBaseUrl } = getClientBaseUrl({ config });
  const { trustedOrigins } = config.server;

  return {
    trustedOrigins: uniq([clientBaseUrl, ...trustedOrigins]),
  };
}

export function isAuthenticationValid({
  session,
  apiKey,
  requiredApiKeyPermissions,
  authType,
}: {
  session?: Session | null | undefined;
  apiKey?: Omit<ApiKey, 'keyHash'> | null | undefined;
  requiredApiKeyPermissions?: ApiKeyPermissions[];
  authType: 'api-key' | 'session' | null;
}): boolean {
  if (!authType) {
    return false;
  }

  if (session && authType !== 'session') {
    return false;
  }

  if (apiKey && authType !== 'api-key') {
    return false;
  }

  if (authType === 'api-key') {
    if (!apiKey) {
      return false;
    }

    if (!requiredApiKeyPermissions) {
      return false;
    }

    const allPermissionsMatch = requiredApiKeyPermissions.every(permission => apiKey.permissions.includes(permission));

    return allPermissionsMatch;
  }

  if (authType === 'session' && session) {
    return true;
  }

  return false;
}

// DB <-> Business model transformers

// Auth Session transformers

export function dbToAuthSession(dbSession?: DbSelectableAuthSession): AuthSession | undefined {
  if (!dbSession) {
    return undefined;
  }

  return {
    id: dbSession.id,
    token: dbSession.token,
    userId: dbSession.user_id,
    ipAddress: dbSession.ip_address,
    userAgent: dbSession.user_agent,
    activeOrganizationId: dbSession.active_organization_id,
    createdAt: new Date(dbSession.created_at),
    updatedAt: new Date(dbSession.updated_at),
    expiresAt: new Date(dbSession.expires_at),
  };
}

export function authSessionToDb(
  session: InsertableAuthSession,
  {
    now = new Date(),
    generateId = generateAuthSessionId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableAuthSession {
  return {
    id: session.id ?? generateId(),
    token: session.token,
    user_id: session.userId,
    ip_address: session.ipAddress,
    user_agent: session.userAgent,
    active_organization_id: session.activeOrganizationId,
    created_at: session.createdAt?.getTime() ?? now.getTime(),
    updated_at: session.updatedAt?.getTime() ?? now.getTime(),
    expires_at: session.expiresAt.getTime(),
  };
}

// Auth Account transformers

export function dbToAuthAccount(dbAccount?: DbSelectableAuthAccount): AuthAccount | undefined {
  if (!dbAccount) {
    return undefined;
  }

  return {
    id: dbAccount.id,
    userId: dbAccount.user_id,
    accountId: dbAccount.account_id,
    providerId: dbAccount.provider_id,
    accessToken: dbAccount.access_token,
    refreshToken: dbAccount.refresh_token,
    scope: dbAccount.scope,
    idToken: dbAccount.id_token,
    password: dbAccount.password,
    createdAt: new Date(dbAccount.created_at),
    updatedAt: new Date(dbAccount.updated_at),
    accessTokenExpiresAt: isNil(dbAccount.access_token_expires_at) ? null : new Date(dbAccount.access_token_expires_at),
    refreshTokenExpiresAt: isNil(dbAccount.refresh_token_expires_at) ? null : new Date(dbAccount.refresh_token_expires_at),
  };
}

export function authAccountToDb(
  account: InsertableAuthAccount,
  {
    now = new Date(),
    generateId = generateAuthAccountId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableAuthAccount {
  return {
    id: account.id ?? generateId(),
    user_id: account.userId,
    account_id: account.accountId,
    provider_id: account.providerId,
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    scope: account.scope,
    id_token: account.idToken,
    password: account.password,
    created_at: account.createdAt?.getTime() ?? now.getTime(),
    updated_at: account.updatedAt?.getTime() ?? now.getTime(),
    access_token_expires_at: account.accessTokenExpiresAt?.getTime(),
    refresh_token_expires_at: account.refreshTokenExpiresAt?.getTime(),
  };
}

// Auth Verification transformers

export function dbToAuthVerification(dbVerification?: DbSelectableAuthVerification): AuthVerification | undefined {
  if (!dbVerification) {
    return undefined;
  }

  return {
    id: dbVerification.id,
    identifier: dbVerification.identifier,
    value: dbVerification.value,
    createdAt: new Date(dbVerification.created_at),
    updatedAt: new Date(dbVerification.updated_at),
    expiresAt: new Date(dbVerification.expires_at),
  };
}

export function authVerificationToDb(
  verification: InsertableAuthVerification,
  {
    now = new Date(),
    generateId = generateAuthVerificationId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableAuthVerification {
  return {
    id: verification.id ?? generateId(),
    identifier: verification.identifier,
    value: verification.value,
    created_at: verification.createdAt?.getTime() ?? now.getTime(),
    updated_at: verification.updatedAt?.getTime() ?? now.getTime(),
    expires_at: verification.expiresAt.getTime(),
  };
}
