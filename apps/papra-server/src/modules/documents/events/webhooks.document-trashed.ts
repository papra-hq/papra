import type { EventServices } from '../../app/events/events.services';
import type { WebhookTriggerServices } from '../../webhooks/webhooks.trigger.services';

export function registerTriggerWebhooksOnDocumentTrashedHandler({
  eventServices,
  webhookTriggerServices,
}: {
  eventServices: EventServices;
  webhookTriggerServices: WebhookTriggerServices;
}) {
  eventServices.onEvent({
    eventName: 'document.trashed',
    handlerName: 'trigger-webhooks',
    async handler({ documentId, organizationId }) {
      await webhookTriggerServices.triggerWebhooks({
        organizationId,
        event: 'document:deleted',
        payload: {
          documentId,
          organizationId,
        },
      });
    },
  });
}
