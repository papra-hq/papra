import type { EventServices } from '../../app/events/events.services';
import type { WebhookTriggerServices } from '../../webhooks/webhooks.trigger.services';
import pLimit from 'p-limit';

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
      const limit = pLimit(10);

      await Promise.all(
        documentIds.map(async documentId =>
          limit(async () =>
            webhookTriggerServices.triggerWebhooks({
              organizationId,
              event: 'document:deleted',
              payload: {
                documentId,
                organizationId,
              },
            }),
          ),
        ),
      );
    },
  });
}
