import { omit } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { createLogger } from '../logger';
import { createInMemoryLoggerTransport } from './in-memory.logger-transport';

describe('in-memory logger-transport', () => {
  test('logged messages are accessible through getLogs', () => {
    const transport = createInMemoryLoggerTransport();

    const logger = createLogger({
      namespace: 'test',
      transports: [transport],
    });

    logger.info('Hello world');
    logger.error({ error: new Error('An error occurred') }, 'An error occurred');

    expect(transport.getLogs().map(log => omit(log, 'timestampMs'))).to.eql([
      {
        level: 'info',
        message: 'Hello world',
        namespace: 'test',
        data: {},
      },
      {
        level: 'error',
        message: 'An error occurred',
        namespace: 'test',
        data: {
          error: new Error('An error occurred'),
        },
      },
    ]);
  });
});
