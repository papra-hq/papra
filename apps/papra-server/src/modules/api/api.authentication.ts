import { addLogContext } from '@crowlog/async-context-plugin';
import type { ApiKeyPermissions } from '../api-keys/api-keys.types';
import { createUnauthorizedError } from '../app/auth/auth.errors';

export function buildResolveAuthenticationContext({
  getSession,
  getApiKey,
}: {
  getSession: (args: { headers: Headers }) => Promise<{ userId: string } | null>;
  getApiKey: (args: {
    headers: Headers;
  }) => Promise<{ userId: string; permissions: ApiKeyPermissions[]; apiKeyId: string } | null>;
}) {
  return ({ apiKeyPermissions }: { apiKeyPermissions?: ApiKeyPermissions[] } = {}) =>
    async ({
      request,
    }: {
      request: Request;
    }): Promise<
      | { userId: string; authType: 'session' }
      | { userId: string; apiKeyId: string; authType: 'api-key' }
    > => {
      const headers = request.headers;

      const session = await getSession({ headers });

      if (session) {
        // Reject ambiguous credentials, even on session-only routes. The injected
        // lookup must return null without querying storage when no API-key token is present.
        if (await getApiKey({ headers })) {
          throw createUnauthorizedError();
        }

        const context = {
          userId: session.userId,
          authType: 'session' as const,
        };

        addLogContext(context);
        return context;
      }

      if (apiKeyPermissions === undefined) {
        throw createUnauthorizedError();
      }

      const apiKey = await getApiKey({ headers });

      if (!apiKey) {
        throw createUnauthorizedError();
      }

      const hasAllPermissions = apiKeyPermissions.every((permission) =>
        apiKey.permissions.includes(permission),
      );

      if (!hasAllPermissions) {
        throw createUnauthorizedError();
      }

      const context = {
        userId: apiKey.userId,
        apiKeyId: apiKey.apiKeyId,
        authType: 'api-key' as const,
      };

      addLogContext(context);
      return context;
    };
}

export type ResolveAuthenticationContext = ReturnType<typeof buildResolveAuthenticationContext>;
