import type { BinaryLike, BinaryToTextEncoding } from 'node:crypto';
import crypto from 'node:crypto';
import { Transform } from 'node:stream';
import { isNil } from 'lodash-es';

export async function getStreamSha256Hash<Stream extends ReadableStream<Uint8Array> = ReadableStream<Uint8Array>>({ stream, digest = 'hex' }: { stream: Stream; digest?: BinaryToTextEncoding }): Promise<{ hash: string }> {
  const hash = crypto.createHash('sha256');

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return { hash: hash.digest(digest) };
}

export function createSha256HashTransformer({ digest = 'hex' }: { digest?: BinaryToTextEncoding } = {}) {
  const hasher = crypto.createHash('sha256');
  let hash: string | undefined;

  const tap = new Transform({
    transform(chunk: BinaryLike, _, callback) {
      hasher.update(chunk);
      callback(null, chunk);
    },
    final(callback) {
      hash = hasher.digest(digest);
      callback();
    },
  });

  return {
    getHash: () => {
      if (isNil(hash)) {
        throw new Error('Hash not computed yet');
      }
      return hash;
    },
    tap,
  };
}
