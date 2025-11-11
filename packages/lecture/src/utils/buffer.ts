import { Buffer } from 'node:buffer';

export function castToBuffer(maybeArrayBuffer: ArrayBuffer | Buffer): Buffer {
  const buffer = maybeArrayBuffer instanceof ArrayBuffer ? Buffer.from(maybeArrayBuffer) : maybeArrayBuffer;
  return buffer;
}
