import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import { createWebhookRepository } from '../../webhooks/webhook.repository';
import { triggerWebhooks } from '../../webhooks/webhook.usecases';

export function registerTriggerWebhooksOnDocumentCreatedHandler({
  eventServices,
  db,
}: {
  eventServices: EventServices;
  db: Database;
}) {
  const webhookRepository = createWebhookRepository({ db });

  eventServices.onEvent({
    eventName: 'document.created',
    handlerName: 'trigger-webhooks',
    async handler({ document }) {
      await triggerWebhooks({
        webhookRepository,
        organizationId: document.organizationId,
        event: 'document:created',
        payload: {
          documentId: document.id,
          organizationId: document.organizationId,
          name: document.name,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        },
      });
    },
  });
}
