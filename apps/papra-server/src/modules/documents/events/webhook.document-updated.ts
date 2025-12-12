import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import { createWebhookRepository } from '../../webhooks/webhook.repository';
import { triggerWebhooks } from '../../webhooks/webhook.usecases';

export function registerTriggerWebhooksOnDocumentUpdatedHandler({
  eventServices,
  db,
}: {
  eventServices: EventServices;
  db: Database;
}) {
  const webhookRepository = createWebhookRepository({ db });

  eventServices.onEvent({
    eventName: 'document.updated',
    handlerName: 'trigger-webhooks',
    async handler({ document, changes }) {
      await triggerWebhooks({
        webhookRepository,
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
