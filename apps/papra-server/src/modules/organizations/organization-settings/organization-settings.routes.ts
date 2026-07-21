import { requireAuthentication } from '../../app/auth/auth.middleware';
import type { RouteDefinitionContext } from '../../app/server.types';
import { validateJsonBody, validateParams } from '../../shared/validation/validation';
import * as v from 'valibot';
import { organizationIdSchema } from '../organization.schemas';
import { getUser } from '../../app/auth/auth.models';
import { createOrganizationsRepository } from '../organizations.repository';
import {
  ensureUserIsInOrganization,
  ensureUserIsOwnerOfOrganization,
} from '../organizations.usecases';
import { createOrganizationSettingsRepository } from './organization-settings.repository';
import { resolveOrganizationSettings } from './organization-settings.usecases';
import { formatOrganizationSettingsForApiResponse } from './organization-settings.models';

export function registerOrganizationSettingsRoutes(context: RouteDefinitionContext) {
  setupGetOrganizationSettingsRoute(context);
  setupUpdateOrganizationSettingsRoute(context);
}

export function setupGetOrganizationSettingsRoute({ app, db, config }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/settings',
    requireAuthentication({ apiKeyPermissions: ['organizations:read'] }),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      const organizationSettingsRepository = createOrganizationSettingsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { organizationSettings } = await resolveOrganizationSettings({
        organizationId,
        organizationSettingsRepository,
        config,
      });

      return context.json({
        organizationSettings: formatOrganizationSettingsForApiResponse({ organizationSettings }),
      });
    },
  );
}

export function setupUpdateOrganizationSettingsRoute({ app, db }: RouteDefinitionContext) {
  app.patch(
    '/api/organizations/:organizationId/settings',
    requireAuthentication({ apiKeyPermissions: ['organizations:update'] }),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
    validateJsonBody(
      v.strictObject({
        ai: v.optional(
          v.strictObject({
            autoTagging: v.optional(
              v.strictObject({
                isEnabled: v.optional(v.boolean()),
                canCreateNewTags: v.optional(v.boolean()),
                maxTags: v.optional(
                  v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
                ),
              }),
            ),
          }),
        ),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const organizationSettingsPartials = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      const organizationSettingsRepository = createOrganizationSettingsRepository({ db });

      await ensureUserIsOwnerOfOrganization({ userId, organizationId, organizationsRepository });

      await organizationSettingsRepository.createOrUpdateOrganizationSettings({
        organizationId,
        settings: {
          aiAutoTaggingCanCreateNewTags:
            organizationSettingsPartials.ai?.autoTagging?.canCreateNewTags,
          aiAutoTaggingEnabled: organizationSettingsPartials.ai?.autoTagging?.isEnabled,
          aiAutoTaggingMaxTags: organizationSettingsPartials.ai?.autoTagging?.maxTags,
        },
      });

      return context.body(null, 204);
    },
  );
}
