import type { Config } from '../../config/config.types';
import type { TrackingServices } from '../../tracking/tracking.services';
import type { Database } from '../database/database.types';
import type { AuthEmailsServices } from './auth.emails.services';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth } from 'better-auth/plugins';
import { createLogger } from '../../shared/logger/logger';
import { usersTable } from '../../users/users.table';
import { getTrustedOrigins } from './auth.models';
import { accountsTable, sessionsTable, verificationsTable } from './auth.tables';

export type Auth = ReturnType<typeof getAuth>['auth'];

const logger = createLogger({ namespace: 'auth' });

export function getAuth({
  db,
  config,
  authEmailsServices,
  trackingServices,
}: {
  db: Database;
  config: Config;
  authEmailsServices: AuthEmailsServices;
  trackingServices: TrackingServices;
}) {
  const { secret } = config.auth;

  const { trustedOrigins } = getTrustedOrigins({ config });

  const auth = betterAuth({
    secret,
    baseURL: config.server.baseUrl,
    trustedOrigins,
    logger: {
      disabled: false,
      log: (baseLevel, message) => {
        logger[baseLevel ?? 'info'](message);
      },
    },
    emailAndPassword: {
      enabled: config.auth.providers.email.isEnabled,
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

    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            logger.info({ userId: user.id }, 'User signed up');
            trackingServices.captureUserEvent({ userId: user.id, event: 'User signed up' });
          },
        },
      },
    },

    advanced: {
      // Drizzle tables handle the id generation
      database: { generateId: false },
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
    plugins: [
      ...(config.auth.providers.customs.length > 0
        ? [genericOAuth({ config: config.auth.providers.customs })]
        : []),
    ],
  });

  return {
    auth,
  };
}
