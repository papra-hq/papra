import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';
import { describe, expect, test } from 'vitest';
import { collectReadableStreamToBuffer, collectReadableStreamToString, createReadableStream, fileToReadableStream } from './readable-stream';

describe('readable-stream', () => {
  describe('collectReadableStreamToString', () => {
    test('fully reads a readable stream and returns its content as a string', async () => {
      const content = 'Hello, world!';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(content));
          controller.close();
        },
      });

      const result = await collectReadableStreamToString({ stream });

      expect(result).toEqual('Hello, world!');
    });

    test('useful to read a File object stream', async () => {
      const file = new File(['Hello, world!'], 'hello.txt', { type: 'text/plain' });
      const stream = file.stream();

      const result = await collectReadableStreamToString({ stream });

      expect(result).toEqual('Hello, world!');
    });

    test('it also collects native streams', async () => {
      const stream = new Readable();
      stream.push('Hello, world!');
      stream.push(null);

      const result = await collectReadableStreamToString({ stream });

      expect(result).toEqual('Hello, world!');
    });
  });

  describe('collectReadableStreamToBuffer', () => {
    test('fully reads a readable stream and returns its content as a buffer', async () => {
      const stream = createReadableStream({ content: 'Hello, world!' });

      const result = await collectReadableStreamToBuffer({ stream });

      expect(result).to.eql(Buffer.from('Hello, world!'));
    });
  });

  describe('fileToReadableStream', () => {
    test('converts a File object to a native Readable stream', async () => {
      const file = new File(['Hello, world!'], 'hello.txt', { type: 'text/plain' });
      const stream = fileToReadableStream(file);

      expect(stream).toBeInstanceOf(Readable);

      const result = await collectReadableStreamToString({ stream });

      expect(result).toEqual('Hello, world!');
    });
  });

  describe('createReadableStream', () => {
    test('creates a readable stream from a string', async () => {
      const stream = createReadableStream({ content: 'Hello, world!' });

      const result = await collectReadableStreamToString({ stream });

      expect(result).toEqual('Hello, world!');
    });

    test('creates a readable stream from a buffer', async () => {
      const stream = createReadableStream({ content: Buffer.from('Hello, world!') });

      const result = await collectReadableStreamToString({ stream });

      expect(result).toEqual('Hello, world!');
    });
  });
});
