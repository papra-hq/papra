import { createInvalidSignatureFormatError, createUnsupportedSignatureVersionError } from './handler/handler.errors';

const WEBHOOK_SIGNATURE_HMAC_VERSION = 'v1';

export function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

export function base64ToArrayBuffer(base64: string) {
  return new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0))).buffer;
}

function createSignaturePayload({
  serializedPayload,
  webhookId,
  timestamp,
}: {
  serializedPayload: string;
  webhookId: string;
  timestamp: string;
}) {
  return `${webhookId}.${timestamp}.${serializedPayload}`;
}

async function hmacSign({ secret, payload }: { secret: string; payload: string }) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, encoder.encode(payload));
}

export async function signBody({
  serializedPayload,
  webhookId,
  timestamp,
  secret,
}: {
  serializedPayload: string;
  webhookId: string;
  timestamp: string;
  secret: string;
}) {
  const payload = createSignaturePayload({ serializedPayload, webhookId, timestamp });

  const rawSignature = await hmacSign({ secret, payload });
  const signatureBase64 = arrayBufferToBase64(rawSignature);
  const signature = `${WEBHOOK_SIGNATURE_HMAC_VERSION},${signatureBase64}`;

  return { signature };
}

export async function verifySignature({
  serializedPayload,
  webhookId,
  timestamp,
  signature: base64Signature,
  secret,
}: {
  serializedPayload: string;
  webhookId: string;
  timestamp: string;
  signature: string;
  secret: string;
}): Promise<boolean> {
  const [version, signature] = base64Signature.split(',', 2);

  if (!signature || !version) {
    throw createInvalidSignatureFormatError();
  }

  if (version !== WEBHOOK_SIGNATURE_HMAC_VERSION) {
    throw createUnsupportedSignatureVersionError();
  }

  const payload = createSignaturePayload({ serializedPayload, webhookId, timestamp });

  const signatureBuffer = base64ToArrayBuffer(signature);

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);

  return crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(payload));
}
