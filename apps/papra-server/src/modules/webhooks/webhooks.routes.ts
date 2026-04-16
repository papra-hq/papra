import type { RouteDefinitionContext } from '../app/server.types';
import * as v from 'valibot';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createWebhookNotFoundError } from './webhooks.errors';
import { formatWebhookForApi } from './webhooks.models';
import { createWebhookRepository } from './webhooks.repository';
import { webhookEventListSchema, webhookIdSchema, webhookNameSchema, webhookSecretSchema, webhookUrlSchema } from './webhooks.schemas';
import { createWebhook, updateWebhook } from './webhooks.usecases';

export function registerWebhooksRoutes(context: RouteDefinitionContext) {
  setupCreateWebhookRoute(context);
  setupGetWebhooksRoute(context);
  setupGetWebhookRoute(context);
  setupUpdateWebhookRoute(context);
  setupDeleteWebhookRoute(context);
}

function setupCreateWebhookRoute({ app, db, config }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/webhooks',
    requireAuthentication(),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
    })),
    validateJsonBody(v.strictObject({
      name: webhookNameSchema,
      url: webhookUrlSchema,
      secret: v.optional(webhookSecretSchema),
      enabled: v.optional(v.boolean(), true),
      events: webhookEventListSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { name, url, secret, enabled, events } = context.req.valid('json');
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const webhookRepository = createWebhookRepository({ db });

      const { webhook } = await createWebhook({
        name,
        url,
        secret,
        enabled,
        events,
        organizationId,
        webhookRepository,
        createdBy: userId,
        webhooksConfig: config.webhooks,
      });

      return context.json({
        webhook: formatWebhookForApi(webhook),
      });
    },
  );
}

function setupGetWebhooksRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/webhooks',
    requireAuthentication(),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const webhookRepository = createWebhookRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { webhooks } = await webhookRepository.getOrganizationWebhooks({ organizationId });

      return context.json({
        webhooks: webhooks.map(formatWebhookForApi),
      });
    },
  );
}

function setupGetWebhookRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/webhooks/:webhookId',
    requireAuthentication(),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
      webhookId: webhookIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, webhookId } = context.req.valid('param');

      const webhookRepository = createWebhookRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { webhook } = await webhookRepository.getOrganizationWebhookById({ webhookId, organizationId });

      if (!webhook) {
        throw createWebhookNotFoundError();
      }

      return context.json({
        webhook: formatWebhookForApi(webhook),
      });
    },
  );
}

function setupUpdateWebhookRoute({ app, db, config }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/webhooks/:webhookId',
    requireAuthentication(),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
      webhookId: webhookIdSchema,
    })),
    validateJsonBody(v.strictObject({
      name: v.optional(webhookNameSchema),
      url: v.optional(webhookUrlSchema),
      secret: v.optional(webhookSecretSchema),
      enabled: v.optional(v.boolean()),
      events: v.optional(webhookEventListSchema),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { webhookId, organizationId } = context.req.valid('param');
      const { name, url, secret, enabled, events } = context.req.valid('json');

      const webhookRepository = createWebhookRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { webhook } = await updateWebhook({
        webhookId,
        name,
        url,
        secret,
        enabled,
        events,
        webhookRepository,
        organizationId,
        webhooksConfig: config.webhooks,
      });

      return context.json({
        webhook: formatWebhookForApi(webhook),
      });
    },
  );
}

function setupDeleteWebhookRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/webhooks/:webhookId',
    requireAuthentication(),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
      webhookId: webhookIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { webhookId, organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const webhookRepository = createWebhookRepository({ db });

      const { webhook } = await webhookRepository.getOrganizationWebhookById({ webhookId, organizationId });

      if (!webhook) {
        throw createWebhookNotFoundError();
      }

      await webhookRepository.deleteOrganizationWebhook({ webhookId, organizationId });

      return context.body(null, 204);
    },
  );
}
