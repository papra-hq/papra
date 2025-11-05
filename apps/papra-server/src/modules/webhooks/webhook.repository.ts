import type { EventName } from '@papra/webhooks';
import type { DatabaseClient } from '../app/database/database.types';
import type { Webhook, WebhookEvent } from './webhooks.tables';
import { injectArguments } from '@corentinth/chisels';
import { sql } from 'kysely';
import { omitUndefined } from '../shared/utils';
import { dbToWebhook, dbToWebhookEvent, webhookDeliveryToDb, webhookEventToDb, webhookToDb } from './webhooks.models';

export type WebhookRepository = ReturnType<typeof createWebhookRepository>;

export function createWebhookRepository({ db }: { db: DatabaseClient }) {
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

async function createOrganizationWebhook({ db, ...webhook }: { db: DatabaseClient } & { name: string; url: string; secret?: string; enabled?: boolean; events?: EventName[]; organizationId: string; createdBy: string }) {
  const dbCreatedWebhook = await db
    .insertInto('webhooks')
    .values(webhookToDb({
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret,
      enabled: webhook.enabled,
      organizationId: webhook.organizationId,
      createdBy: webhook.createdBy,
    }))
    .returningAll()
    .executeTakeFirst();

  if (!dbCreatedWebhook) {
    // Very unlikely to happen as the query will throw an error if the webhook is not created
    // it's for type safety
    throw new Error('Failed to create webhook');
  }

  const createdWebhook = dbToWebhook(dbCreatedWebhook);

  if (!createdWebhook) {
    throw new Error('Failed to transform created webhook');
  }

  if (webhook.events && webhook.events.length > 0) {
    await db
      .insertInto('webhook_events')
      .values(
        webhook.events.map(eventName => webhookEventToDb({
          webhookId: createdWebhook.id,
          eventName,
        })),
      )
      .execute();
  }

  return { webhook: createdWebhook };
}

async function updateOrganizationWebhook({ db, webhookId, events, organizationId, ...webhook }: { db: DatabaseClient; webhookId: string; events?: EventName[]; organizationId: string } & { name?: string; url?: string; secret?: string; enabled?: boolean }) {
  const updates: { name?: string; url?: string; secret?: string; enabled?: number; updated_at?: number } = {};

  if (webhook.name !== undefined) {
    updates.name = webhook.name;
  }
  if (webhook.url !== undefined) {
    updates.url = webhook.url;
  }
  if (webhook.secret !== undefined) {
    updates.secret = webhook.secret;
  }
  if (webhook.enabled !== undefined) {
    updates.enabled = webhook.enabled ? 1 : 0;
  }
  updates.updated_at = Date.now();

  const dbUpdatedWebhook = await db
    .updateTable('webhooks')
    .set(omitUndefined(updates))
    .where('id', '=', webhookId)
    .where('organization_id', '=', organizationId)
    .returningAll()
    .executeTakeFirst();

  const updatedWebhook = dbToWebhook(dbUpdatedWebhook);

  if (events) {
    // Delete existing events
    await db
      .deleteFrom('webhook_events')
      .where('webhook_id', '=', webhookId)
      .execute();

    // Insert new events
    if (events.length) {
      await db
        .insertInto('webhook_events')
        .values(
          events.map(eventName => webhookEventToDb({
            webhookId,
            eventName,
          })),
        )
        .execute();
    }
  }

  return { webhook: updatedWebhook };
}

async function getOrganizationWebhookById({ db, webhookId, organizationId }: { db: DatabaseClient; webhookId: string; organizationId: string }) {
  const records = await db
    .selectFrom('webhooks')
    .leftJoin('webhook_events', 'webhooks.id', 'webhook_events.webhook_id')
    .where('webhooks.id', '=', webhookId)
    .where('webhooks.organization_id', '=', organizationId)
    .select([
      'webhooks.id',
      'webhooks.name',
      'webhooks.url',
      'webhooks.secret',
      'webhooks.enabled',
      'webhooks.created_by',
      'webhooks.organization_id',
      'webhooks.created_at',
      'webhooks.updated_at',
      'webhook_events.event_name',
    ])
    .execute();

  if (!records.length) {
    return { webhook: undefined };
  }

  const [firstRecord] = records;

  if (!firstRecord) {
    return { webhook: undefined };
  }

  const dbWebhook = {
    id: firstRecord.id,
    name: firstRecord.name,
    url: firstRecord.url,
    secret: firstRecord.secret,
    enabled: firstRecord.enabled,
    created_by: firstRecord.created_by,
    organization_id: firstRecord.organization_id,
    created_at: firstRecord.created_at,
    updated_at: firstRecord.updated_at,
  };

  const webhook = dbToWebhook(dbWebhook);
  const events = records.map(record => record.event_name).filter((eventName): eventName is string => eventName !== null && eventName !== undefined);

  return { webhook: webhook ? { ...webhook, events } : undefined };
}

async function deleteOrganizationWebhook({ db, webhookId, organizationId }: { db: DatabaseClient; webhookId: string; organizationId: string }) {
  await db
    .deleteFrom('webhooks')
    .where('id', '=', webhookId)
    .where('organization_id', '=', organizationId)
    .execute();
}

async function getOrganizationWebhooks({ db, organizationId }: { db: DatabaseClient; organizationId: string }) {
  // Create a subquery for the latest delivery date per webhook
  const latestDeliverySubquery = db
    .selectFrom('webhook_deliveries')
    .select([
      'webhook_id',
      sql<number>`max(created_at)`.as('last_triggered_at'),
    ])
    .groupBy('webhook_id')
    .as('latest_delivery');

  const rawWebhooks = await db
    .selectFrom('webhooks')
    .leftJoin('webhook_events', 'webhooks.id', 'webhook_events.webhook_id')
    .leftJoin(latestDeliverySubquery, 'webhooks.id', 'latest_delivery.webhook_id')
    .where('webhooks.organization_id', '=', organizationId)
    .select([
      'webhooks.id',
      'webhooks.name',
      'webhooks.url',
      'webhooks.secret',
      'webhooks.enabled',
      'webhooks.created_by',
      'webhooks.organization_id',
      'webhooks.created_at',
      'webhooks.updated_at',
      'webhook_events.id as webhook_event_id',
      'webhook_events.webhook_id as webhook_event_webhook_id',
      'webhook_events.event_name',
      'webhook_events.created_at as webhook_event_created_at',
      'webhook_events.updated_at as webhook_event_updated_at',
      'latest_delivery.last_triggered_at',
    ])
    .execute();

  const webhooksRecord = rawWebhooks
    .reduce((acc, record) => {
      const webhookId = record.id;

      if (!acc[webhookId]) {
        const dbWebhook = {
          id: record.id,
          name: record.name,
          url: record.url,
          secret: record.secret,
          enabled: record.enabled,
          created_by: record.created_by,
          organization_id: record.organization_id,
          created_at: record.created_at,
          updated_at: record.updated_at,
        };
        const webhook = dbToWebhook(dbWebhook);

        if (webhook) {
          acc[webhookId] = {
            ...webhook,
            events: [],
            lastTriggeredAt: record.last_triggered_at ? new Date(record.last_triggered_at) : null,
          };
        }
      }

      if (record.webhook_event_id && acc[webhookId]) {
        const dbEvent = {
          id: record.webhook_event_id,
          webhook_id: record.webhook_event_webhook_id!,
          event_name: record.event_name!,
          created_at: record.webhook_event_created_at!,
          updated_at: record.webhook_event_updated_at!,
        };
        const webhookEvent = dbToWebhookEvent(dbEvent);
        if (webhookEvent) {
          acc[webhookId].events.push(webhookEvent);
        }
      }

      return acc;
    }, {} as Record<string, Webhook & { events: WebhookEvent[]; lastTriggeredAt: Date | null }>);

  return { webhooks: Object.values(webhooksRecord) };
}

async function getOrganizationEnabledWebhooksForEvent({ db, organizationId, event }: { db: DatabaseClient; organizationId: string; event: EventName }) {
  const dbWebhooks = await db
    .selectFrom('webhooks')
    .leftJoin('webhook_events', 'webhooks.id', 'webhook_events.webhook_id')
    .where('webhooks.organization_id', '=', organizationId)
    .where('webhooks.enabled', '=', 1)
    .where('webhook_events.event_name', '=', event)
    .select([
      'webhooks.id',
      'webhooks.name',
      'webhooks.url',
      'webhooks.secret',
      'webhooks.enabled',
      'webhooks.created_by',
      'webhooks.organization_id',
      'webhooks.created_at',
      'webhooks.updated_at',
    ])
    .execute();

  const webhooks = dbWebhooks.map(dbWh => dbToWebhook(dbWh)).filter((wh): wh is NonNullable<typeof wh> => wh !== undefined);

  return { webhooks };
}

async function saveWebhookDelivery({ db, webhookId, eventName, requestPayload, responsePayload, responseStatus }: { db: DatabaseClient; webhookId: string; eventName: string; requestPayload: string; responsePayload: string; responseStatus: number }) {
  await db
    .insertInto('webhook_deliveries')
    .values(webhookDeliveryToDb({
      webhookId,
      eventName,
      requestPayload,
      responsePayload,
      responseStatus,
    }))
    .execute();
}
