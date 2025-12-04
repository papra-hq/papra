import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import { createWebhookRepository } from '../../webhooks/webhook.repository';
import { triggerWebhooks } from '../../webhooks/webhook.usecases';

export function registerTriggerWebhooksOnDocumentTrashedHandler({
  eventServices,
  db,
}: {
  eventServices: EventServices;
  db: Database;
}) {
  const webhookRepository = createWebhookRepository({ db });

  eventServices.onEvent({
    eventName: 'document.trashed',
    handlerName: 'trigger-webhooks',
    async handler({ documentId, organizationId }) {
      await triggerWebhooks({
        webhookRepository,
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
