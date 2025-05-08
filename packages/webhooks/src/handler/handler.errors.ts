export function createInvalidSignatureError() {
  return Object.assign(
    new Error('[Papra Webhooks] Invalid signature'),
    {
      code: 'INVALID_SIGNATURE',
    },
  );
}
