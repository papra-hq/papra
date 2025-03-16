import type { Config } from '../../config/config.types';
import type { Database } from '../database/database.types';
import type { AuthEmailsServices } from './auth.emails.services';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createLogger } from '../../shared/logger/logger';
import { usersTable } from '../../users/users.table';
import { accountsTable, sessionsTable, verificationsTable } from './auth.tables';

export type Auth = ReturnType<typeof getAuth>['auth'];

const logger = createLogger({ namespace: 'auth' });

export function getAuth({ db, config, authEmailsServices }: { db: Database; config: Config; authEmailsServices: AuthEmailsServices }) {
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
      requireEmailVerification: config.auth.isEmailVerificationRequired,
      sendResetPassword: config.auth.isPasswordResetEnabled
        ? authEmailsServices.sendPasswordResetEmail
        : undefined,
    },
    appName: 'Papra',
    account: {
      accountLinking: {
        enabled: true,
      },
    },
    emailVerification: {
      sendVerificationEmail: authEmailsServices.sendVerificationEmail,
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

    advanced: {
      // Drizzle tables handle the id generation
      generateId: false,
    },
    socialProviders: {
      github: {
        enabled: config.auth.providers.github.isEnabled,
        clientId: config.auth.providers.github.clientId,
        clientSecret: config.auth.providers.github.clientSecret,
        disableSignUp: !config.auth.isRegistrationEnabled,
        disableImplicitSignUp: !config.auth.isRegistrationEnabled,
      },
      google: {
        enabled: config.auth.providers.google.isEnabled,
        clientId: config.auth.providers.google.clientId,
        clientSecret: config.auth.providers.google.clientSecret,
        disableSignUp: !config.auth.isRegistrationEnabled,
        disableImplicitSignUp: !config.auth.isRegistrationEnabled,
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
