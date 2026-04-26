import type { EventServices } from '../../app/events/events.services';
import type { WebhookTriggerServices } from '../../webhooks/webhooks.trigger.services';

export function registerTriggerWebhooksOnDocumentCreatedHandler({
  eventServices,
  webhookTriggerServices,
}: {
  eventServices: EventServices;
  webhookTriggerServices: WebhookTriggerServices;
}) {
  eventServices.onEvent({
    eventName: 'document.created',
    handlerName: 'trigger-webhooks',
    async handler({ document }) {
      await webhookTriggerServices.triggerWebhooks({
        organizationId: document.organizationId,
        event: 'document:created',
        payloads: [{
          documentId: document.id,
          organizationId: document.organizationId,
          name: document.name,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        }],
      });
    },
  });
}
