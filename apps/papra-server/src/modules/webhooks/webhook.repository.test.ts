import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createWebhookRepository } from './webhook.repository';

describe('webhook repository', () => {
  describe('getOrganizationWebhooks', () => {
    test('includes the most recent webhook delivery timestamp as lastTriggeredAt', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Test Organization' },
        ],
        webhooks: [
          { id: 'wbh_1', name: 'Test Webhook', url: 'https://example.com/webhook', organizationId: 'org_1' },
        ],
        webhookDeliveries: [
          { id: 'wbh_dlv_1', webhookId: 'wbh_1', eventName: 'document:created', requestPayload: '{}', responsePayload: '{}', responseStatus: 200, createdAt: new Date('2025-01-01') },
          { id: 'wbh_dlv_2', webhookId: 'wbh_1', eventName: 'document:updated', requestPayload: '{}', responsePayload: '{}', responseStatus: 200, createdAt: new Date('2025-01-15') },
          { id: 'wbh_dlv_3', webhookId: 'wbh_1', eventName: 'document:deleted', requestPayload: '{}', responsePayload: '{}', responseStatus: 200, createdAt: new Date('2025-01-10') },
        ],
      });

      const webhookRepository = createWebhookRepository({ db });
      const { webhooks } = await webhookRepository.getOrganizationWebhooks({ organizationId: 'org_1' });

      expect(webhooks).to.have.length(1);
      const [webhook] = webhooks;

      expect(webhook?.lastTriggeredAt).to.eql(new Date('2025-01-15'));
    });

    test('no deliveries results in null lastTriggeredAt', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Test Organization' },
        ],
        webhooks: [
          { id: 'wbh_1', name: 'Test Webhook', url: 'https://example.com/webhook', organizationId: 'org_1' },
        ],
      });

      const webhookRepository = createWebhookRepository({ db });
      const { webhooks } = await webhookRepository.getOrganizationWebhooks({ organizationId: 'org_1' });

      expect(webhooks).to.have.length(1);
      const [webhook] = webhooks;

      expect(webhook?.lastTriggeredAt).to.eql(null);
    });
  });
});
