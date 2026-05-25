import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { omit } from '../shared/objects';
import { createWebhookRepository } from './webhooks.repository';
import { webhookDeliveriesTable, webhookEventsTable, webhooksTable } from './webhooks.tables';
import { createWebhook, triggerWebhooks, updateWebhook } from './webhooks.usecases';

describe('webhook usecases', () => {
  describe('createWebhook', () => {
    test('when SSRF protection is enabled, creating a webhook with a private IP URL throws ssrf_unsafe_url', async () => {
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

      await expect(createWebhook({
        name: 'Test Webhook',
        url: 'https://127.0.0.1/webhook',
        events: ['document:created'],
        webhookRepository,
        organizationId: 'org_1',
        createdBy: 'user_1',
        webhooksConfig: {
          isSsrfProtectionEnabled: true,
          webhookUrlAllowedHostnames: new Set<string>(),
        },
      })).rejects.toThrow('The provided URL is not safe to perform requests to');
    });

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
        webhooksConfig: {
          isSsrfProtectionEnabled: false,
          webhookUrlAllowedHostnames: new Set<string>(),
        },
      });

      expect(webhook).to.deep.include({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        secret: 'test-secret',
        enabled: true,
      });

      // Verify events were created
      const events = await db.select().from(webhookEventsTable).where(eq(webhookEventsTable.webhookId, webhook.id));
      expect(events.map(e => omit(e, ['createdAt', 'updatedAt', 'id']))).to.eql([
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
    test('when SSRF protection is enabled, updating a webhook with a private IP URL throws ssrf_unsafe_url', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Test Organization' },
        ],
        webhooks: [
          { id: 'wbh_1', name: 'Test Webhook', url: 'https://example.com/webhook', organizationId: 'org_1' },
        ],
      });
      const webhookRepository = createWebhookRepository({ db });

      await expect(updateWebhook({
        webhookId: 'wbh_1',
        url: 'https://10.0.0.1/webhook',
        webhookRepository,
        organizationId: 'org_1',
        webhooksConfig: {
          isSsrfProtectionEnabled: true,
          webhookUrlAllowedHostnames: new Set<string>(),
        },
      })).rejects.toThrow('The provided URL is not safe to perform requests to');
    });

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
        webhooksConfig: {
          isSsrfProtectionEnabled: false,
          webhookUrlAllowedHostnames: new Set<string>(),
        },
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
      expect(events.map(e => omit(e, ['createdAt', 'updatedAt', 'id']))).to.eql([
        {
          webhookId: 'wbh_1',
          eventName: 'document:deleted',
        },
      ]);
    });
  });

  describe('triggerWebhooks', () => {
    test('when one webhook delivery fails (e.g. blocked by SSRF protection at connect time), sibling webhooks still complete', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Organization 1' },
        ],
        webhooks: [
          { id: 'wbh_1', name: 'Unsafe Webhook', url: 'https://192.168.1.1/webhook', organizationId: 'org_1', enabled: true },
          { id: 'wbh_2', name: 'Safe Webhook', url: 'https://example.com/webhook', organizationId: 'org_1', enabled: true },
        ],
        webhookEvents: [
          { id: 'wbh_ev_1', webhookId: 'wbh_1', eventName: 'document:created' },
          { id: 'wbh_ev_2', webhookId: 'wbh_2', eventName: 'document:created' },
        ],
      });

      const webhookRepository = createWebhookRepository({ db });
      const { logger } = createTestLogger();
      const httpClientArgs: { url: string }[] = [];

      await triggerWebhooks({
        webhookRepository,
        organizationId: 'org_1',
        event: 'document:created',
        payloads: [{
          documentId: 'doc_1',
          organizationId: 'org_1',
          name: 'Document 1',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        }],
        logger,
        httpClient: async (args) => {
          httpClientArgs.push(args);

          if (args.url.includes('192.168')) {
            const error = new Error('IP 192.168.1.1 is blocked by net.BlockList') as Error & { code?: string };
            error.code = 'ERR_IP_BLOCKED';
            throw error;
          }

          return { responseData: {}, responseStatus: 200 };
        },
      });

      expect(httpClientArgs.map(a => a.url)).to.eql([
        'https://192.168.1.1/webhook',
        'https://example.com/webhook',
      ]);

      const deliveries = await db.select().from(webhookDeliveriesTable);

      expect(deliveries.length).to.eq(1);
      expect(deliveries[0]).to.include({ responseStatus: 200 });
    });

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
      const httpClientArgs: { url: string; body: string; headers: Record<string, string> }[] = [];

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
        payloads: [eventPayload],
        logger,
        now: new Date('2025-05-04'),
        httpClient: async (args) => {
          httpClientArgs.push(args);
          return { responseData: {}, responseStatus: 200 };
        },
      });

      expect(httpClientArgs.map(a => a.url)).to.eql([
        'https://example.com/webhook1',
        'https://example.com/webhook3',
      ]);

      for (const args of httpClientArgs) {
        expect(JSON.parse(args.body)).to.eql({
          type: 'document:created',
          timestamp: '2025-05-04T00:00:00.000Z',
          data: {
            ...eventPayload,
            createdAt: eventPayload.createdAt.toISOString(),
            updatedAt: eventPayload.updatedAt.toISOString(),
          },
        });
      }

      // Only the webhook with a configured secret should produce a signature header
      expect(httpClientArgs[0]?.headers['webhook-signature']).toBeUndefined();
      expect(typeof httpClientArgs[1]?.headers['webhook-signature']).to.eq('string');
    });
  });
});
