import { describe, expect, test } from 'vitest';
import { parseUsageInfo } from './ai-credits.middlewares';
import { createTestLogger } from '../shared/logger/logger.test-utils';

describe('ai-credits.middlewares', () => {
  describe('parseUsageInfo', () => {
    test('given tanstack-ai usage reports, it resolve input token from promptTokens, and output tokens from completionTokens', () => {
      const { getLogs, logger } = createTestLogger();

      expect(
        parseUsageInfo(
          {
            promptTokens: 20,
            completionTokens: 10,
            totalTokens: 30,
          },
          logger,
        ),
      ).to.eql({
        inputTokens: 20,
        outputTokens: 10,
      });

      expect(getLogs()).to.eql([]);
    });

    test('when the totalToken count does not match the sum of promptTokens and completionTokens, it logs a warning and resolves input tokens from totalTokens - outputTokens', () => {
      const { getLogs, logger } = createTestLogger();

      expect(
        parseUsageInfo(
          {
            promptTokens: 20,
            completionTokens: 10,
            totalTokens: 25,
          },
          logger,
        ),
      ).to.eql({
        inputTokens: 15,
        outputTokens: 10,
      });

      expect(getLogs({ excludeTimestampMs: true })).to.eql([
        {
          data: {
            usage: {
              completionTokens: 10,
              promptTokens: 20,
              totalTokens: 25,
            },
          },
          level: 'warn',
          message: 'Usage info does not match total tokens',
          namespace: 'test',
        },
      ]);
    });

    test("when the totalToken count doesn't match the sum, and for some reason the difference is negative, it logs a warning and resolves input tokens to 0", () => {
      const { getLogs, logger } = createTestLogger();

      expect(
        parseUsageInfo(
          {
            promptTokens: 20,
            completionTokens: 10,
            totalTokens: 5,
          },
          logger,
        ),
      ).to.eql({
        inputTokens: 0,
        outputTokens: 10,
      });

      expect(getLogs({ excludeTimestampMs: true })).to.eql([
        {
          data: {
            usage: {
              completionTokens: 10,
              promptTokens: 20,
              totalTokens: 5,
            },
          },
          level: 'warn',
          message: 'Usage info does not match total tokens',
          namespace: 'test',
        },
      ]);
    });
  });
});
