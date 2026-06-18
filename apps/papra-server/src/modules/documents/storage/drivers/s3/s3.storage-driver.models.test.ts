import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';
import { describe, expect, test } from 'vitest';
import {
  collectReadableStreamToString,
  createReadableStream,
} from '../../../../shared/streams/readable-stream';
import { bufferStreamUpToThreshold, buildEndpointUrl } from './s3.storage-driver.models';

function streamFromChunks(chunks: string[]) {
  return Readable.from(
    (async function* () {
      yield* chunks.map((chunk) => Buffer.from(chunk));
    })(),
  );
}

describe('s3.storage-driver.models', () => {
  describe('bufferStreamUpToThreshold', () => {
    // A small stream (<= threshold) is fully read into a Buffer so the caller can send a single,
    // known-size PUT instead of paying for a multipart upload.
    test('fully buffers a stream whose size stays within the threshold', async () => {
      const result = await bufferStreamUpToThreshold({
        stream: createReadableStream({ content: 'Hello, world!' }),
        thresholdInBytes: 1024,
      });

      expect(result.isFullyBuffered).to.eql(true);
      expect((result as { buffer: Buffer }).buffer.toString()).to.eql('Hello, world!');
    });

    test('fully buffers an empty stream into an empty buffer', async () => {
      const result = await bufferStreamUpToThreshold({
        stream: streamFromChunks([]),
        thresholdInBytes: 1024,
      });

      expect(result.isFullyBuffered).to.eql(true);
      expect((result as { buffer: Buffer }).buffer.length).to.eql(0);
    });

    // A stream larger than the threshold is not buffered; instead a stream is returned that re-emits
    // the already-read chunks followed by the remainder, losing no data, so it can be streamed out.
    test('returns a stream that preserves all content once the threshold is exceeded', async () => {
      const result = await bufferStreamUpToThreshold({
        // 18 bytes total, threshold of 10 is crossed partway through.
        stream: streamFromChunks(['123456', '789012', '345678']),
        thresholdInBytes: 10,
      });

      expect(result.isFullyBuffered).to.eql(false);
      expect(
        await collectReadableStreamToString({ stream: (result as { stream: Readable }).stream }),
      ).to.eql('123456789012345678');
    });

    test('treats a size exactly at the threshold as fully buffered', async () => {
      const result = await bufferStreamUpToThreshold({
        stream: streamFromChunks(['1234567890']),
        thresholdInBytes: 10,
      });

      expect(result.isFullyBuffered).to.eql(true);
      expect((result as { buffer: Buffer }).buffer.toString()).to.eql('1234567890');
    });
  });

  describe('buildEndpointUrl', () => {
    // Unlike the AWS SDK, s3mini does not take the bucket as a separate parameter: it must be
    // baked into the endpoint URL. This rebuilds that URL from the decomposed config we expose,
    // keeping the existing env var surface (endpoint / bucketName / forcePathStyle) backward compatible.

    describe('with a custom endpoint (self-hosted, R2, MinIO, localstack, ...)', () => {
      test('in path-style, the bucket is appended as the first path segment', () => {
        expect(
          buildEndpointUrl({
            endpoint: 'http://localhost:4566',
            region: 'eu-central-1',
            bucketName: 'my-bucket',
            forcePathStyle: true,
          }),
        ).to.eql('http://localhost:4566/my-bucket');
      });

      test('in virtual-hosted style, the bucket is prepended as a subdomain', () => {
        expect(
          buildEndpointUrl({
            endpoint: 'https://s3.example.com',
            region: 'eu-central-1',
            bucketName: 'my-bucket',
            forcePathStyle: false,
          }),
        ).to.eql('https://my-bucket.s3.example.com/');
      });

      test('the endpoint port is preserved in both styles', () => {
        expect(
          buildEndpointUrl({
            endpoint: 'http://localhost:9000',
            region: 'eu-central-1',
            bucketName: 'my-bucket',
            forcePathStyle: true,
          }),
        ).to.eql('http://localhost:9000/my-bucket');

        expect(
          buildEndpointUrl({
            endpoint: 'http://minio.local:9000',
            region: 'eu-central-1',
            bucketName: 'my-bucket',
            forcePathStyle: false,
          }),
        ).to.eql('http://my-bucket.minio.local:9000/');
      });

      test('a trailing slash on the endpoint does not produce a double slash in path-style', () => {
        expect(
          buildEndpointUrl({
            endpoint: 'http://localhost:4566/',
            region: 'eu-central-1',
            bucketName: 'my-bucket',
            forcePathStyle: true,
          }),
        ).to.eql('http://localhost:4566/my-bucket');
      });

      test('an existing path prefix on the endpoint is kept, with the bucket appended after it', () => {
        expect(
          buildEndpointUrl({
            endpoint: 'https://gateway.example.com/storage',
            region: 'eu-central-1',
            bucketName: 'my-bucket',
            forcePathStyle: true,
          }),
        ).to.eql('https://gateway.example.com/storage/my-bucket');
      });
    });

    describe('without an endpoint (real AWS S3), the regional endpoint is derived from the region', () => {
      test('in path-style, the bucket is appended to the regional host', () => {
        expect(
          buildEndpointUrl({
            endpoint: undefined,
            region: 'us-east-1',
            bucketName: 'my-bucket',
            forcePathStyle: true,
          }),
        ).to.eql('https://s3.us-east-1.amazonaws.com/my-bucket');
      });

      test('in virtual-hosted style, the bucket is prepended to the regional host', () => {
        expect(
          buildEndpointUrl({
            endpoint: undefined,
            region: 'eu-west-3',
            bucketName: 'my-bucket',
            forcePathStyle: false,
          }),
        ).to.eql('https://my-bucket.s3.eu-west-3.amazonaws.com/');
      });
    });
  });
});
