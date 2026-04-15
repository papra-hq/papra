import { describe, expect, test } from 'vitest';
import { formatWebhookForApi } from './webhooks.models';

describe('webhooks formatter', () => {
  describe('formatWebhookForApi', () => {
    test('removes the secret field from a webhook', () => {
      expect(
        formatWebhookForApi({
          id: 'wbh_1',
          name: 'My Webhook',
          url: 'https://example.com/hook',
          secret: 's3cr3t',
          enabled: true,
          organizationId: 'org_1',
          createdBy: 'user_1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }),
      ).to.eql({
        id: 'wbh_1',
        name: 'My Webhook',
        url: 'https://example.com/hook',
        enabled: true,
        organizationId: 'org_1',
        createdBy: 'user_1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
    });

    test('preserve extra fields if present', () => {
      expect(
        formatWebhookForApi({
          id: 'wbh_1',
          name: 'My Webhook',
          url: 'https://example.com/hook',
          secret: 's3cr3t',
          enabled: true,
          organizationId: 'org_1',
          createdBy: 'user_1',
          events: ['document:created', 'document:updated'], // Extra field
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        }),
      ).to.eql({
        id: 'wbh_1',
        name: 'My Webhook',
        url: 'https://example.com/hook',
        enabled: true,
        organizationId: 'org_1',
        events: ['document:created', 'document:updated'],
        createdBy: 'user_1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
    });
  });
});
