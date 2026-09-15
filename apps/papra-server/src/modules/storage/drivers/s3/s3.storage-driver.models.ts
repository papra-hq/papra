import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

// s3mini only sends a single PUT when it knows the body size; an unknown-length stream always
// triggers a 3-request multipart upload (create + part + complete). To avoid paying that on every
// upload, we buffer the stream up to a threshold: small files become a single PUT with a known-size
// Buffer, and only genuinely large files fall back to streaming/multipart. Mirrors AWS lib-storage.
export async function bufferStreamUpToThreshold({
  stream,
  thresholdInBytes,
}: {
  stream: Readable;
  thresholdInBytes: number;
}): Promise<
  { isFullyBuffered: true; buffer: Buffer } | { isFullyBuffered: false; stream: Readable }
> {
  // Drive the iterator manually rather than `for await` so an early break does not destroy the
  // source stream: we need to keep reading from it if we cross the threshold.
  const iterator = stream[Symbol.asyncIterator]();
  const chunks: Buffer[] = [];
  let total = 0;

  while (true) {
    const { value, done } = await iterator.next();

    if (done) {
      return { isFullyBuffered: true, buffer: Buffer.concat(chunks) };
    }

    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
    chunks.push(chunk);
    total += chunk.length;

    if (total > thresholdInBytes) {
      break;
    }
  }

  // Threshold exceeded: re-emit what we already read, then drain the rest of the source.
  const reassembled = Readable.from(
    (async function* () {
      yield* chunks;

      while (true) {
        const { value, done } = await iterator.next();

        if (done) {
          return;
        }

        yield value;
      }
    })(),
  );

  return { isFullyBuffered: false, stream: reassembled };
}

export function buildEndpointUrl({
  endpoint,
  region,
  bucketName,
  forcePathStyle,
}: {
  endpoint: string | undefined;
  region: string;
  bucketName: string;
  forcePathStyle: boolean;
}) {
  const url = new URL(endpoint ?? `https://s3.${region}.amazonaws.com`);

  if (forcePathStyle) {
    // Path-style: https://host[:port]/bucket
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/${bucketName}`;
  } else {
    // Virtual-hosted style: https://bucket.host[:port]
    url.hostname = `${bucketName}.${url.hostname}`;
  }

  return url.toString();
}
