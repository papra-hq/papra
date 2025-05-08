import type { BuildWebhookEventPayload, WebhookEvents, WebhookPayloads } from '../webhooks.types';
import { EventEmitter } from 'tsee';
import { verifySignature } from '../signature';
import { parseBody } from '../webhooks.models';
import { createInvalidSignatureError } from './handler.errors';

export function createWebhooksHandler({
  secret,
  onInvalidSignature = () => {
    createInvalidSignatureError();
  },
}: {
  secret: string;
  onInvalidSignature?: ({ bodyBuffer, signature }: { bodyBuffer: ArrayBuffer; signature: string }) => void | Promise<void>;
}) {
  const eventEmitter = new EventEmitter<WebhookEvents & { '*': (payload: BuildWebhookEventPayload<WebhookPayloads>) => void }>();

  return {
    on: eventEmitter.on,
    ee: eventEmitter,
    handle: async ({ bodyBuffer, signature }: { bodyBuffer: ArrayBuffer; signature: string }) => {
      const isValid = await verifySignature({ bodyBuffer, signature, secret });

      if (!isValid) {
        await onInvalidSignature({ bodyBuffer, signature });
        return;
      }

      const payload = parseBody(bodyBuffer.toString());
      const { event } = payload;

      eventEmitter.emit(event, payload as any);
      eventEmitter.emit('*', payload);
    },
  };
}
