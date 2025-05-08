import type { EventName } from '@papra/webhooks';
import type { Database } from '../app/database/database.types';
import type { Webhook, WebhookDeliveryInsert, WebhookEvent } from './webhooks.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { omitUndefined } from '../shared/utils';
import { webhookDeliveriesTable, webhookEventsTable, webhooksTable } from './webhooks.tables';

export type WebhookRepository = ReturnType<typeof createWebhookRepository>;

export function createWebhookRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      createOrganizationWebhook,
      updateOrganizationWebhook,
      getOrganizationWebhookById,
      deleteOrganizationWebhook,
      getOrganizationWebhooks,
      getOrganizationEnabledWebhooksForEvent,
      saveWebhookDelivery,
    },
    { db },
  );
}

async function createOrganizationWebhook({ db, ...webhook }: { db: Database } & { name: string; url: string; secret?: string; enabled?: boolean; events?: EventName[]; organizationId: string; createdBy: string }) {
  const [createdWebhook] = await db.insert(webhooksTable).values(webhook).returning();

  if (webhook.events?.length) {
    await db
      .insert(webhookEventsTable)
      .values(
        webhook.events.map(eventName => ({
          webhookId: createdWebhook.id,
          eventName,
        })),
      );
  }

  return { webhook: createdWebhook };
}

async function updateOrganizationWebhook({ db, webhookId, events, organizationId, ...webhook }: { db: Database; webhookId: string; events?: EventName[]; organizationId: string } & { name?: string; url?: string; secret?: string; enabled?: boolean }) {
  const [updatedWebhook] = await db
    .update(webhooksTable)
    .set(omitUndefined(webhook))
    .where(
      and(
        eq(webhooksTable.id, webhookId),
        eq(webhooksTable.organizationId, organizationId),
      ),
    )
    .returning();

  if (events) {
    // Delete existing events
    await db
      .delete(webhookEventsTable)
      .where(eq(webhookEventsTable.webhookId, webhookId));

    // Insert new events
    if (events.length) {
      await db.insert(webhookEventsTable).values(
        events.map(eventName => ({
          webhookId,
          eventName,
        })),
      );
    }
  }

  return { webhook: updatedWebhook };
}

async function getOrganizationWebhookById({ db, webhookId, organizationId }: { db: Database; webhookId: string; organizationId: string }) {
  const records = await db
    .select({
      webhook: getTableColumns(webhooksTable),
      webhookEvents: getTableColumns(webhookEventsTable),
    })
    .from(webhooksTable)
    .leftJoin(webhookEventsTable, eq(webhooksTable.id, webhookEventsTable.webhookId))
    .where(
      and(
        eq(webhooksTable.id, webhookId),
        eq(webhooksTable.organizationId, organizationId),
      ),
    );

  const [{ webhook } = {}] = records;
  const events = records.map(record => record.webhookEvents?.eventName);

  return { webhook: { ...webhook, events } };
}

async function deleteOrganizationWebhook({ db, webhookId, organizationId }: { db: Database; webhookId: string; organizationId: string }) {
  await db.delete(webhooksTable).where(
    and(
      eq(webhooksTable.id, webhookId),
      eq(webhooksTable.organizationId, organizationId),
    ),
  );
}

async function getOrganizationWebhooks({ db, organizationId }: { db: Database; organizationId: string }) {
  const rawWebhooks = await db
    .select()
    .from(webhooksTable)
    .leftJoin(webhookEventsTable, eq(webhooksTable.id, webhookEventsTable.webhookId))
    .where(eq(webhooksTable.organizationId, organizationId));

  const webhooksRecord = rawWebhooks
    .reduce((acc, { webhooks, webhook_events }) => {
      const webhookId = webhooks.id;
      const webhookEvents = webhook_events;

      if (!acc[webhookId]) {
        acc[webhookId] = {
          ...webhooks,
          events: [],
        };
      }

      if (webhookEvents) {
        acc[webhookId].events.push(webhookEvents);
      }

      return acc;
    }, {} as Record<string, Webhook & { events: WebhookEvent[] }>);

  return { webhooks: Object.values(webhooksRecord) };
}

async function getOrganizationEnabledWebhooksForEvent({ db, organizationId, event }: { db: Database; organizationId: string; event: EventName }) {
  const webhooks = await db
    .select({
      ...getTableColumns(webhooksTable),
    })
    .from(webhooksTable)
    .leftJoin(webhookEventsTable, eq(webhooksTable.id, webhookEventsTable.webhookId))
    .where(
      and(
        eq(webhooksTable.organizationId, organizationId),
        eq(webhooksTable.enabled, true),
        eq(webhookEventsTable.eventName, event),
      ),
    );

  return { webhooks };
}

async function saveWebhookDelivery({ db, ...webhookDelivery }: { db: Database } & WebhookDeliveryInsert) {
  await db.insert(webhookDeliveriesTable).values(webhookDelivery);
}
