import { eq } from 'drizzle-orm';
import { omit } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createWebhookRepository } from './webhook.repository';
import { createWebhook, triggerWebhooks, updateWebhook } from './webhook.usecases';
import { webhookEventsTable, webhooksTable } from './webhooks.tables';

describe('webhook usecases', () => {
  describe('createWebhook', () => {
    test('creates a new webhook and saves the events in the webhook_events table', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Test Organization' },
        ],
        users: [
          { id: 'user_1', email: 'test@example.com', name: 'Test User' },
        ],
        organizationMembers: [
          { organizationId: 'org_1', userId: 'user_1', role: ORGANIZATION_ROLES.OWNER },
        ],
      });
      const webhookRepository = createWebhookRepository({ db });

      const { webhook } = await createWebhook({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        secret: 'test-secret',
        events: ['document:created', 'document:deleted'],
        webhookRepository,
        organizationId: 'org_1',
        createdBy: 'user_1',
      });

      expect(webhook).to.deep.include({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        secret: 'test-secret',
        enabled: true,
      });

      // Verify events were created
      const events = await db.select().from(webhookEventsTable).where(eq(webhookEventsTable.webhookId, webhook.id));
      expect(events.map(e => omit(e, 'createdAt', 'updatedAt', 'id'))).to.eql([
        {
          webhookId: webhook.id,
          eventName: 'document:created',
        },
        {
          webhookId: webhook.id,
          eventName: 'document:deleted',
        },
      ]);
    });
  });

  describe('updateWebhook', () => {
    test('updates a webhook and saves the events in the webhook_events table', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Test Organization' },
        ],
        webhooks: [
          { id: 'wbh_1', name: 'Test Webhook', url: 'https://example.com/webhook', organizationId: 'org_1' },
        ],
        webhookEvents: [
          { id: 'wbh_ev_1', webhookId: 'wbh_1', eventName: 'document:created' },
          { id: 'wbh_ev_2', webhookId: 'wbh_1', eventName: 'document:deleted' },
        ],
      });
      const webhookRepository = createWebhookRepository({ db });

      await updateWebhook({
        webhookId: 'wbh_1',
        name: 'Test Webhook',
        url: 'https://foo.bar',
        secret: 'test-secret',
        events: ['document:deleted'],
        webhookRepository,
        organizationId: 'org_1',
      });

      const webhooks = await db.select().from(webhooksTable);
      expect(webhooks.length).to.eq(1);
      const [webhook] = webhooks;

      expect(webhook).to.deep.include({
        id: 'wbh_1',
        name: 'Test Webhook',
        url: 'https://foo.bar',
        secret: 'test-secret',
        organizationId: 'org_1',
      });

      const events = await db.select().from(webhookEventsTable).where(eq(webhookEventsTable.webhookId, 'wbh_1'));
      expect(events.map(e => omit(e, 'createdAt', 'updatedAt', 'id'))).to.eql([
        {
          webhookId: 'wbh_1',
          eventName: 'document:deleted',
        },
      ]);
    });
  });

  describe('triggerWebhooks', () => {
    test('when an organization has webhooks enabled for an event, the configured urls are called with the event payload', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Organization 1' },
          { id: 'org_2', name: 'Organization 2' },
        ],
        webhooks: [
          // webhook 1 is enabled and has the event document.created
          { id: 'wbh_1', name: 'Test Webhook', url: 'https://example.com/webhook1', organizationId: 'org_1', enabled: true },
          // webhook 2 is enabled and has the event document.deleted (so it will not be triggered)
          { id: 'wbh_2', name: 'Test Webhook', url: 'https://example.com/webhook2', organizationId: 'org_1', enabled: true },
          // webhook 3 is enabled and has the event document.created (so it will be triggered)
          { id: 'wbh_3', name: 'Test Webhook', url: 'https://example.com/webhook3', organizationId: 'org_1', secret: 'secret3' }, // by default the webhook is enabled
          // webhook 4 is disabled and has the event document.created (so it will not be triggered)
          { id: 'wbh_4', name: 'Test Webhook', url: 'https://example.com/webhook4', organizationId: 'org_1', enabled: false },
          // webhook 5 is related to organization 2 and has the event document.created (so it will not be triggered)
          { id: 'wbh_5', name: 'Test Webhook', url: 'https://example.com/webhook5', organizationId: 'org_2', enabled: true },
        ],
        webhookEvents: [
          { id: 'wbh_ev_1', webhookId: 'wbh_1', eventName: 'document:created' },
          { id: 'wbh_ev_2', webhookId: 'wbh_2', eventName: 'document:deleted' },
          { id: 'wbh_ev_3', webhookId: 'wbh_3', eventName: 'document:created' },
          { id: 'wbh_ev_4', webhookId: 'wbh_4', eventName: 'document:created' },
          { id: 'wbh_ev_5', webhookId: 'wbh_5', eventName: 'document:created' },
        ],
      });

      const webhookRepository = createWebhookRepository({ db });
      const { logger } = createTestLogger();
      const triggerWebhookServiceArgs: unknown[] = [];

      const eventPayload = {
        documentId: 'doc_1',
        organizationId: 'org_1',
        name: 'Document 1',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      await triggerWebhooks({
        webhookRepository,
        organizationId: 'org_1',
        event: 'document:created',
        payload: eventPayload,
        logger,
        now: new Date('2025-05-04'),
        triggerWebhookService: async (args) => {
          triggerWebhookServiceArgs.push(args);

          const { event, payload } = args;

          return {
            responseData: {},
            responseStatus: 200,
            requestPayload: JSON.stringify({ event, payload }),
          };
        },
      });

      expect(triggerWebhookServiceArgs).to.eql([
        {
          webhookUrl: 'https://example.com/webhook1',
          webhookSecret: null,
          now: new Date('2025-05-04'),
          event: 'document:created',
          payload: eventPayload,
        },
        {
          webhookUrl: 'https://example.com/webhook3',
          webhookSecret: 'secret3',
          now: new Date('2025-05-04'),
          event: 'document:created',
          payload: eventPayload,
        },
      ]);
    });
  });
});
