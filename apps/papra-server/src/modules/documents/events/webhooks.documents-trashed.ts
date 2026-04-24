import type { EventServices } from '../../app/events/events.services';
import type { WebhookTriggerServices } from '../../webhooks/webhooks.trigger.services';

export function registerTriggerWebhooksOnDocumentsTrashedHandler({
  eventServices,
  webhookTriggerServices,
}: {
  eventServices: EventServices;
  webhookTriggerServices: WebhookTriggerServices;
}) {
  eventServices.onEvent({
    eventName: 'documents.trashed',
    handlerName: 'trigger-webhooks',
    async handler({ documentIds, organizationId }) {
      await webhookTriggerServices.triggerWebhooks({
        organizationId,
        event: 'document:deleted',
        payloads: documentIds.map(documentId => ({
          documentId,
          organizationId,
        })),
      });
    },
  });
}
