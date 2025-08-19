import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { describe, expect, test } from 'vitest';
import { createSha256HashTransformer } from './stream-hash';

describe('stream-hash', () => {
  describe('createSha256HashTransformer', () => {
    test('creates a transformer that can be used to hash a stream', async () => {
      const transformer = createSha256HashTransformer();

      const stream = new PassThrough();

      stream.write('Hello, world!');
      stream.end();

      await pipeline(stream, transformer.tap);

      expect(transformer.getHash()).toBe('315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3');
      expect(transformer.getHash()).toBe('315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3');
    });
  });
});
