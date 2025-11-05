import type {
  DbInsertableWebhook,
  DbInsertableWebhookDelivery,
  DbInsertableWebhookEvent,
  DbSelectableWebhook,
  DbSelectableWebhookDelivery,
  DbSelectableWebhookEvent,
  InsertableWebhook,
  InsertableWebhookDelivery,
  InsertableWebhookEvent,
  Webhook,
  WebhookDelivery,
  WebhookEvent,
} from './webhooks.tables';
import { generateId } from '../shared/random/ids';

const generateWebhookId = () => generateId({ prefix: 'wbh' });
const generateWebhookEventId = () => generateId({ prefix: 'wbh_ev' });
const generateWebhookDeliveryId = () => generateId({ prefix: 'wbh_dlv' });

// Webhook transformers

export function dbToWebhook(dbWebhook?: DbSelectableWebhook): Webhook | undefined {
  if (!dbWebhook) {
    return undefined;
  }

  return {
    id: dbWebhook.id,
    name: dbWebhook.name,
    url: dbWebhook.url,
    secret: dbWebhook.secret,
    enabled: dbWebhook.enabled === 1,
    createdBy: dbWebhook.created_by,
    organizationId: dbWebhook.organization_id,
    createdAt: new Date(dbWebhook.created_at),
    updatedAt: new Date(dbWebhook.updated_at),
  };
}

export function webhookToDb(
  webhook: InsertableWebhook,
  {
    now = new Date(),
    generateId = generateWebhookId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableWebhook {
  return {
    id: webhook.id ?? generateId(),
    name: webhook.name,
    url: webhook.url,
    secret: webhook.secret,
    enabled: webhook.enabled === true ? 1 : 0,
    created_by: webhook.createdBy,
    organization_id: webhook.organizationId,
    created_at: webhook.createdAt?.getTime() ?? now.getTime(),
    updated_at: webhook.updatedAt?.getTime() ?? now.getTime(),
  };
}

// Webhook Event transformers

export function dbToWebhookEvent(dbEvent?: DbSelectableWebhookEvent): WebhookEvent | undefined {
  if (!dbEvent) {
    return undefined;
  }

  return {
    id: dbEvent.id,
    webhookId: dbEvent.webhook_id,
    eventName: dbEvent.event_name,
    createdAt: new Date(dbEvent.created_at),
    updatedAt: new Date(dbEvent.updated_at),
  };
}

export function webhookEventToDb(
  event: InsertableWebhookEvent,
  {
    now = new Date(),
    generateId = generateWebhookEventId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableWebhookEvent {
  return {
    id: event.id ?? generateId(),
    webhook_id: event.webhookId,
    event_name: event.eventName,
    created_at: event.createdAt?.getTime() ?? now.getTime(),
    updated_at: event.updatedAt?.getTime() ?? now.getTime(),
  };
}

// Webhook Delivery transformers

export function dbToWebhookDelivery(dbDelivery?: DbSelectableWebhookDelivery): WebhookDelivery | undefined {
  if (!dbDelivery) {
    return undefined;
  }

  return {
    id: dbDelivery.id,
    webhookId: dbDelivery.webhook_id,
    eventName: dbDelivery.event_name,
    requestPayload: dbDelivery.request_payload,
    responsePayload: dbDelivery.response_payload,
    responseStatus: dbDelivery.response_status,
    createdAt: new Date(dbDelivery.created_at),
    updatedAt: new Date(dbDelivery.updated_at),
  };
}

export function webhookDeliveryToDb(
  delivery: InsertableWebhookDelivery,
  {
    now = new Date(),
    generateId = generateWebhookDeliveryId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableWebhookDelivery {
  return {
    id: delivery.id ?? generateId(),
    webhook_id: delivery.webhookId,
    event_name: delivery.eventName,
    request_payload: delivery.requestPayload,
    response_payload: delivery.responsePayload,
    response_status: delivery.responseStatus,
    created_at: delivery.createdAt?.getTime() ?? now.getTime(),
    updated_at: delivery.updatedAt?.getTime() ?? now.getTime(),
  };
}
