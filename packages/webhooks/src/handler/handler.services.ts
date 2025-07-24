import type { StandardWebhookEventPayload, WebhookEvents } from '../webhooks.types';
import { EventEmitter } from 'tsee';
import { verifySignature } from '../signature';
import { parseBody } from '../webhooks.models';
import { createInvalidSignatureError } from './handler.errors';

function handleError({ error }: { error: unknown }) {
  if (error) {
    throw error;
  }

  throw createInvalidSignatureError();
}

export function createWebhooksHandler({
  secret,
  onError = handleError,
}: {
  secret: string;
  onError?: (args: { body: string; signature: string; webhookId: string; timestamp: string; error: unknown }) => void | Promise<void>;
}) {
  const eventEmitter = new EventEmitter<WebhookEvents & { '*': (payload: StandardWebhookEventPayload) => void }>();

  return {
    on: eventEmitter.on,
    ee: eventEmitter,
    handle: async ({ body, signature, webhookId, timestamp }: { body: string; signature: string; webhookId: string; timestamp: string }) => {
      try {
        const isValid = await verifySignature({ serializedPayload: body, signature, secret, webhookId, timestamp });

        if (!isValid) {
          throw createInvalidSignatureError();
        }

        const parsedBody = parseBody(body);
        const { type } = parsedBody;

        eventEmitter.emit(type, parsedBody as any);
        eventEmitter.emit('*', parsedBody);
      } catch (error) {
        await onError({ body, signature, webhookId, timestamp, error });
      }
    },
  };
}
