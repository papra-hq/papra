import { describe, expect, test } from 'vitest';
import { createTestLogger } from '../logger/logger.test-utils';
import { safelyDefer } from './defer';
import { nextTick } from './defer.test-utils';

describe('defer', () => {
  describe('safelyDefer', () => {
    test('execute a function in the next tick in order to avoid blocking the event loop', async () => {
      let called = false;

      safelyDefer(async () => {
        called = true;
      });

      expect(called).to.equal(false);

      await nextTick();

      expect(called).to.equal(true);
    });

    test('if the function throws an error, the error is logged', async () => {
      const { logger, getLogs } = createTestLogger({ namespace: 'defer' });

      safelyDefer(async () => {
        throw new Error('test');
      }, { logger });

      expect(getLogs()).to.deep.equal([]);

      await nextTick();

      const logs = getLogs({ excludeTimestampMs: true });
      expect(logs.length).to.equal(1);

      expect(logs[0]).to.deep.include({

        level: 'error',
        message: 'Error in safelyDefer',
        namespace: 'defer',
        data: {
          error: new Error('test'),
        },
      });
    });
  });
});
