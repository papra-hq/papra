export function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

export function base64ToArrayBuffer(base64: string) {
  return new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0))).buffer;
}

export async function signBody({
  bodyBuffer,
  secret,
}: {
  bodyBuffer: ArrayBuffer;
  secret: string;
}) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  const signature = await crypto.subtle.sign('HMAC', key, bodyBuffer);
  const signatureBase64 = arrayBufferToBase64(signature);

  return { signature: signatureBase64 };
}

export async function verifySignature({
  bodyBuffer,
  signature: base64Signature,
  secret,
}: {
  bodyBuffer: ArrayBuffer;
  signature: string;
  secret: string;
}): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);

  const signatureBuffer = base64ToArrayBuffer(base64Signature);

  return crypto.subtle.verify('HMAC', key, signatureBuffer, bodyBuffer);
}
