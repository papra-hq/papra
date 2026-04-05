import type { EventServices } from '../../app/events/events.services';
import type { WebhookTriggerServices } from '../../webhooks/webhooks.trigger.services';

export function registerTriggerWebhooksOnDocumentUpdatedHandler({
  eventServices,
  webhookTriggerServices,
}: {
  eventServices: EventServices;
  webhookTriggerServices: WebhookTriggerServices;
}) {
  eventServices.onEvent({
    eventName: 'document.updated',
    handlerName: 'trigger-webhooks',
    async handler({ document, changes }) {
      await webhookTriggerServices.triggerWebhooks({
        organizationId: document.organizationId,
        event: 'document:updated',
        payload: {
          documentId: document.id,
          organizationId: document.organizationId,
          ...changes,
        },
      });
    },
  });
}
