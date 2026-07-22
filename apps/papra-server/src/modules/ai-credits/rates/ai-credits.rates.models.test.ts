import { describe, expect, test } from 'vitest';
import { computeCreditsForTokens, getCreditsCostForUsage } from './ai-credits.rates.models';
import { createModelCreditRateNotFoundError } from './ai-credits.rates.errors';

describe('ai-credits.rates.models', () => {
  describe('computeCreditsForTokens', () => {
    test('given a credit rate and a number of input and output tokens, the consumed is the sum of the input and output credits calculated from the credit rate', () => {
      expect(
        computeCreditsForTokens({
          inputTokens: 10_000,
          outputTokens: 20_000,
          creditsRate: {
            creditsPerMillionInputTokens: 5_000,
            creditsPerMillionOutputTokens: 7_000,
          },
        }),
      ).to.eql(190); // (10k / 1M * 5k) + (20k / 1M * 7k) = 50 + 140 = 190
    });

    test('when the calculated credits is less than 1, it returns 1', () => {
      expect(
        computeCreditsForTokens({
          inputTokens: 1,
          outputTokens: 2,
          creditsRate: {
            creditsPerMillionInputTokens: 0.0001,
            creditsPerMillionOutputTokens: 0.0002,
          },
        }),
      ).to.eql(1);
    });

    test('when the calculated credits is a decimal, it returns the ceiling of the value', () => {
      expect(
        computeCreditsForTokens({
          inputTokens: 500_000,
          outputTokens: 1_000_000,
          creditsRate: {
            creditsPerMillionInputTokens: 1,
            creditsPerMillionOutputTokens: 1,
          },
        }),
      ).to.eql(2); // (0.5 + 1) = 1.5 => ceil(1.5) = 2
    });
  });

  describe('getCreditsCostForUsage', () => {
    test('given a modelId and a usage, it returns the credits cost for the usage', () => {
      expect(
        getCreditsCostForUsage({
          modelId: 'provider://dummy',
          usage: {
            inputTokens: 10_000,
            outputTokens: 20_000,
          },
          modelRates: {
            'provider://dummy': {
              creditsPerMillionInputTokens: 5_000,
              creditsPerMillionOutputTokens: 7_000,
            },
          },
        }),
      ).to.eql({
        credits: 190,
        creditsRate: {
          creditsPerMillionInputTokens: 5_000,
          creditsPerMillionOutputTokens: 7_000,
        },
      });
    });

    test('when no rate exists for the given modelId, it throws a ModelCreditRateNotFoundError', () => {
      expect(() =>
        getCreditsCostForUsage({
          modelId: 'provider://unknown',
          usage: {
            inputTokens: 10_000,
            outputTokens: 20_000,
          },
          modelRates: {},
        }),
      ).toThrow(createModelCreditRateNotFoundError());
    });
  });
});
