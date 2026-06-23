import type { EventServices } from '../../app/events/events.services';
import type { WebhookTriggerServices } from '../../webhooks/webhooks.trigger.services';

export function registerTriggerWebhooksOnDocumentTagsChangedHandler({
  eventServices,
  webhookTriggerServices,
}: {
  eventServices: EventServices;
  webhookTriggerServices: WebhookTriggerServices;
}) {
  eventServices.onEvent({
    eventName: 'document.tags.changed',
    handlerName: 'trigger-webhooks',
    async handler({ organizationId, addedPairs, removedPairs }) {
      if (addedPairs.length > 0) {
        await webhookTriggerServices.triggerWebhooks({
          organizationId,
          event: 'document:tag:added',
          payloads: addedPairs.map(({ documentId, tagId, tagName }) => ({
            documentId,
            organizationId,
            tagId,
            tagName,
          })),
        });
      }

      if (removedPairs.length > 0) {
        await webhookTriggerServices.triggerWebhooks({
          organizationId,
          event: 'document:tag:removed',
          payloads: removedPairs.map(({ documentId, tagId, tagName }) => ({
            documentId,
            organizationId,
            tagId,
            tagName,
          })),
        });
      }
    },
  });
}
