import type { WebhookTriggerServices } from '../../webhooks/webhooks.trigger.services';
import { createNoopLogger } from '@crowlog/logger';
import { describe, expect, test } from 'vitest';
import { createEventServices } from '../../app/events/events.services';
import { nextTick } from '../../shared/async/defer.test-utils';
import { registerTriggerWebhooksOnDocumentTagsChangedHandler } from './webhooks.document-tags-changed';

function createStubWebhookTriggerServices() {
  const calls: Parameters<WebhookTriggerServices['triggerWebhooks']>[0][] = [];

  const services = {
    deferTriggerWebhooks: (() => {}) as WebhookTriggerServices['deferTriggerWebhooks'],
    triggerWebhooks: (async (args: Parameters<WebhookTriggerServices['triggerWebhooks']>[0]) => {
      calls.push(args);
    }) as WebhookTriggerServices['triggerWebhooks'],
  } as WebhookTriggerServices;

  return { services, calls };
}

describe('webhooks document-tags-changed', () => {
  describe('registerTriggerWebhooksOnDocumentTagsChangedHandler', () => {
    test('fires a document:tag:added and a document:tag:removed webhook for the changed pairs', async () => {
      const eventServices = createEventServices({ logger: createNoopLogger() });
      const { services: webhookTriggerServices, calls } = createStubWebhookTriggerServices();

      registerTriggerWebhooksOnDocumentTagsChangedHandler({
        eventServices,
        webhookTriggerServices,
      });

      eventServices.emitEvent({
        eventName: 'document.tags.changed',
        payload: {
          organizationId: 'organization-1',
          userId: 'user-1',
          addedPairs: [
            { documentId: 'doc-1', tagId: 'tag-1', tagName: 'Tag One' },
            { documentId: 'doc-2', tagId: 'tag-1', tagName: 'Tag One' },
          ],
          removedPairs: [{ documentId: 'doc-1', tagId: 'tag-2', tagName: 'Tag Two' }],
        },
      });

      await nextTick();

      const addedCall = calls.find((c) => c.event === 'document:tag:added');
      const removedCall = calls.find((c) => c.event === 'document:tag:removed');

      expect(addedCall?.payloads).to.eql([
        {
          documentId: 'doc-1',
          organizationId: 'organization-1',
          tagId: 'tag-1',
          tagName: 'Tag One',
        },
        {
          documentId: 'doc-2',
          organizationId: 'organization-1',
          tagId: 'tag-1',
          tagName: 'Tag One',
        },
      ]);

      expect(removedCall?.payloads).to.eql([
        {
          documentId: 'doc-1',
          organizationId: 'organization-1',
          tagId: 'tag-2',
          tagName: 'Tag Two',
        },
      ]);
    });

    test('does not fire a webhook for an empty side', async () => {
      const eventServices = createEventServices({ logger: createNoopLogger() });
      const { services: webhookTriggerServices, calls } = createStubWebhookTriggerServices();

      registerTriggerWebhooksOnDocumentTagsChangedHandler({
        eventServices,
        webhookTriggerServices,
      });

      eventServices.emitEvent({
        eventName: 'document.tags.changed',
        payload: {
          organizationId: 'organization-1',
          addedPairs: [{ documentId: 'doc-1', tagId: 'tag-1', tagName: 'Tag One' }],
          removedPairs: [],
        },
      });

      await nextTick();

      expect(calls.map((c) => c.event)).to.eql(['document:tag:added']);
    });
  });
});
