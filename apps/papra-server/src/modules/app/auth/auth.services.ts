import type { Config } from '../../config/config.types';
import type { Database } from '../database/database.types';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { createLogger } from '../../shared/logger/logger';
import { usersTable } from '../../users/users.table';
import { accountsTable, sessionsTable, verificationsTable } from './auth.tables';

export type Auth = ReturnType<typeof getAuth>['auth'];

const logger = createLogger({ namespace: 'auth' });

export function getAuth({ db, config }: { db: Database; config: Config }) {
  const { secret } = config.auth;

  const auth = betterAuth({
    secret,

    baseURL: config.server.baseUrl,
    trustedOrigins: [config.client.baseUrl],
    logger: {
      disabled: false,
      log: (baseLevel, message) => {
        const level = (baseLevel in logger ? baseLevel : 'info') as keyof typeof logger;

        logger[level](message);
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    appName: 'Papra',
    account: {
      accountLinking: {
        enabled: true,
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url, token }) => {
        // eslint-disable-next-line no-console
        console.log('sendVerificationEmail', { user, url, token });
      },
    },

    database: drizzleAdapter(
      db,
      {
        provider: 'sqlite',
        schema: {
          user: usersTable,
          account: accountsTable,
          session: sessionsTable,
          verification: verificationsTable,
        },
      },
    ),

    databaseHooks: {
      user: {
        create: {
          before: async (data) => {
            if (!config.auth.isRegistrationEnabled) {
              throw new APIError('FORBIDDEN', { message: 'Registration is disabled' });
            }

            return { data };
          },
        },
      },
    },

    advanced: {
      // Drizzle tables handle the id generation
      generateId: false,
    },
    socialProviders: {
      github: {
        clientId: config.auth.providers.github.clientId,
        clientSecret: config.auth.providers.github.clientSecret,
      },
    },
    user: {
      changeEmail: { enabled: false },
      deleteUser: { enabled: false },
    },
  });

  return {
    auth,
  };
}
