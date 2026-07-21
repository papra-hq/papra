import type { RouteDefinitionContext } from '../../../app/server.types';
import * as v from 'valibot';
import { requireAuthentication } from '../../../app/auth/auth.middleware';
import { getUser } from '../../../app/auth/auth.models';
import { organizationIdSchema } from '../../../organizations/organization.schemas';
import { createOrganizationsRepository } from '../../../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../../../organizations/organizations.usecases';
import { generateId } from '../../../shared/random/ids';
import {
  validateJsonBody,
  validateParams,
  validateQuery,
} from '../../../shared/validation/validation';
import { createBackupsRepository } from '../../backups.repository';
import { createBackupsServices } from '../../backups.services';
import { createDestinationUsecase } from '../../backups.usecases';
import { createGoogleDriveOAuthService } from './google-drive.oauth.service';

// OAuth "state" is a one-time token stored server-side (not just base64'd data in
// the URL) so a tampered state can't be used to attach a stolen refresh token to
// someone else's organization. 10 minutes is generous for a user to go through
// Google's consent screen.
const OAUTH_STATE_TTL_MS = 10 * 60 * 1_000;

const oauthStateSchema = v.object({
  organizationId: v.string(),
  userId: v.string(),
  displayName: v.string(),
});

export function registerGoogleDriveOAuthRoutes({
  app,
  config,
  db,
  kvStore,
}: RouteDefinitionContext) {
  const oauthStateStore = kvStore.defineScope({
    prefix: 'backups:google-drive:oauth-state',
    schema: oauthStateSchema,
  });

  app.post(
    '/api/organizations/:organizationId/backups/google-drive/connect',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    validateJsonBody(
      v.object({
        displayName: v.optional(
          v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
          'Google Drive',
        ),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { displayName } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const state = generateId({ prefix: 'oauthstate' });
      await oauthStateStore.set(
        state,
        { organizationId, userId, displayName },
        {
          expiresAt: Temporal.Instant.fromEpochMilliseconds(Date.now() + OAUTH_STATE_TTL_MS),
        },
      );

      const oauth = createGoogleDriveOAuthService({ config });
      const authorizationUrl = oauth.buildAuthorizationUrl({ state });

      return context.json({ authorizationUrl });
    },
  );

  // Google redirects the user's browser here directly (not an API call from the
  // client app), so this responds with an HTML page that closes itself / redirects
  // back into the app rather than JSON.
  app.get(
    '/api/backups/google-drive/callback',
    validateQuery(
      v.object({
        code: v.optional(v.string()),
        state: v.optional(v.string()),
        error: v.optional(v.string()),
      }),
    ),
    async (context) => {
      const { code, state, error } = context.req.valid('query');
      const redirectBase = (config.appBaseUrl ?? config.client.baseUrl).replace(/\/+$/, '');

      if (error || !code || !state) {
        return context.redirect(
          `${redirectBase}/organizations?backupError=google_drive_oauth_denied`,
        );
      }

      const statePayload = await oauthStateStore.get(state);
      if (!statePayload) {
        return context.redirect(
          `${redirectBase}/organizations?backupError=google_drive_oauth_expired`,
        );
      }
      await oauthStateStore.delete(state);

      const oauth = createGoogleDriveOAuthService({ config });
      const tokens = await oauth.exchangeCodeForTokens({ code });

      if (!tokens.refresh_token) {
        // Happens if the user had already granted consent before and Google
        // skips issuing a new refresh token. Since we always pass prompt=consent
        // this shouldn't normally happen, but fail loudly if it does rather than
        // silently storing a destination with no way to refresh.
        return context.redirect(
          `${redirectBase}/organizations?backupError=google_drive_no_refresh_token`,
        );
      }

      const services = createBackupsServices({ config });
      const repository = createBackupsRepository({ db });

      const { destinationId } = await createDestinationUsecase({
        config,
        services,
        repository,
        organizationId: statePayload.organizationId,
        driver: 'google_drive',
        displayName: statePayload.displayName,
        credentials: { refreshToken: tokens.refresh_token },
        settings: {},
      });

      return context.redirect(`${redirectBase}/`);
    },
  );
}
