import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { describe, expect, test } from 'vitest';
import { createByteCounter } from './byte-counter';

describe('byte-counter', () => {
  describe('createByteCounter', () => {
    test('creates a counter that can be used to count the number of bytes in a stream', async () => {
      const counter = createByteCounter();

      const stream = new PassThrough();

      stream.write('Hello, world!');
      stream.end();

      await pipeline(stream, counter.tap);

      expect(counter.getByteCount()).toBe(13);
    });

    test('a callback can be provided to the counter to be called when the byte count changes', async () => {
      const stream = new PassThrough();

      stream.write('Lorem');

      const args: unknown[] = [];

      const counter = createByteCounter({
        onByteCountChange: ({ byteCount }) => {
          args.push(byteCount);
        },
      });

      stream.write(' ipsum');
      stream.end();

      await pipeline(stream, counter.tap);

      expect(args).toEqual([5, 11]);
    });

    test('the destroy function can be called to stop the stream and throw an error', async () => {
      const stream = new PassThrough();

      stream.write('Lorem');

      const counter = createByteCounter({
        onByteCountChange: ({ destroy }) => {
          destroy({ error: new Error('test') });
        },
      });

      await expect(pipeline(stream, counter.tap)).rejects.toThrow('test');

      expect(stream.destroyed).toBe(true);
    });
  });
});
