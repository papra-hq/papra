import type { Config } from '../../config/config.types';
import type { Database } from '../database/database.types';
import type { EventServices } from '../events/events.services';
import type { AuthEmailsServices } from './auth.emails.services';
import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth, twoFactor } from 'better-auth/plugins';
import { getServerBaseUrl } from '../../config/config.models';
import { createLogger } from '../../shared/logger/logger';
import { usersTable } from '../../users/users.table';
import { createForbiddenEmailDomainError } from './auth.errors';
import { getTrustedOrigins, isEmailDomainAllowed } from './auth.models';
import { accountsTable, sessionsTable, twoFactorTable, verificationsTable } from './auth.tables';

export type Auth = ReturnType<typeof getAuth>['auth'];

const logger = createLogger({ namespace: 'auth' });

export function getAuth({
  db,
  config,
  authEmailsServices,
  eventServices,
}: {
  db: Database;
  config: Config;
  authEmailsServices: AuthEmailsServices;
  eventServices: EventServices;
}) {
  const { secret } = config.auth;

  const { trustedOrigins } = getTrustedOrigins({ config });
  const { serverBaseUrl } = getServerBaseUrl({ config });

  const auth = betterAuth({
    secret,
    baseURL: serverBaseUrl,
    trustedOrigins,
    logger: {
      disabled: false,
      log: (baseLevel, message, ...args: unknown[]) => {
        logger[baseLevel ?? 'info']({ ...args }, message);
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
    emailVerification: config.auth.isEmailVerificationRequired
      ? {
          sendVerificationEmail: authEmailsServices.sendVerificationEmail,
          autoSignInAfterVerification: false,
          sendOnSignIn: true,
          sendOnSignUp: true,
        }
      : undefined,

    database: drizzleAdapter(
      db,
      {
        provider: 'sqlite',
        schema: {
          user: usersTable,
          account: accountsTable,
          session: sessionsTable,
          verification: verificationsTable,
          twoFactor: twoFactorTable,
        },
      },
    ),

    databaseHooks: {
      user: {
        create: {
          before: async ({ email }) => {
            if (!isEmailDomainAllowed({ email, forbiddenEmailDomains: config.auth.forbiddenEmailDomains })) {
              throw createForbiddenEmailDomainError();
            }
          },
          after: async ({ id: userId, email, createdAt }) => {
            logger.info({ userId }, 'User signed up');

            eventServices.emitEvent({
              eventName: 'user.created',
              payload: { userId, email, createdAt },
            });
          },
        },
      },
    },

    advanced: {
      // Drizzle tables handle the id generation
      database: { generateId: false },
      ipAddress: {
        ipAddressHeaders: config.auth.ipAddressHeaders,
      },
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
      expo(),
      twoFactor(),

      ...(config.auth.providers.customs.length > 0
        ? [genericOAuth({ config: config.auth.providers.customs })]
        : []),
    ],
  });

  return {
    auth,
  };
}
