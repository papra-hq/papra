import type { RouteDefinitionContext } from '../app/server.types';
import { omit } from 'lodash-es';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createWebhookNotFoundError } from './webhook.errors';
import { createWebhookRepository } from './webhook.repository';
import { createWebhook, updateWebhook } from './webhook.usecases';
import { webhookEventListSchema } from './webhooks.schemas';

export function registerWebhooksRoutes(context: RouteDefinitionContext) {
  setupCreateWebhookRoute(context);
  setupGetWebhooksRoute(context);
  setupGetWebhookRoute(context);
  setupUpdateWebhookRoute(context);
  setupDeleteWebhookRoute(context);
}

function setupCreateWebhookRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/webhooks',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    validateJsonBody(z.object({
      name: z.string().min(3).max(50),
      url: z.string().url(),
      secret: z.string().min(1).optional(),
      enabled: z.boolean().optional().default(true),
      events: webhookEventListSchema.min(1),
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
      });

      return context.json({
        webhook,
      });
    },
  );
}

function setupGetWebhooksRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/webhooks',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { organizationId } = context.req.valid('param');
      const webhookRepository = createWebhookRepository({ db });

      const { webhooks } = await webhookRepository.getOrganizationWebhooks({ organizationId });

      return context.json({
        webhooks: webhooks.map(webhook => omit(webhook, ['secret'])),
      });
    },
  );
}

function setupGetWebhookRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/webhooks/:webhookId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      webhookId: z.string().min(1),
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
        webhook: omit(webhook, ['secret']),
      });
    },
  );
}

function setupUpdateWebhookRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/webhooks/:webhookId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      webhookId: z.string().min(1),
    })),
    validateJsonBody(z.object({
      name: z.string().min(3).max(50).optional(),
      url: z.string().url().optional(),
      secret: z.string().min(1).optional(),
      enabled: z.boolean().optional(),
      events: webhookEventListSchema.min(1).optional(),
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
      });

      return context.json({
        webhook,
      });
    },
  );
}

function setupDeleteWebhookRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/webhooks/:webhookId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      webhookId: z.string().min(1),
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
