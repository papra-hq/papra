import type { ContentExtractionCreditRate, ModelCreditRate } from './rates/ai-credits.rates';

export type AiCreditsUsageDetails =
  | {
      type: 'llm-model';
      modelId: string;
      inputTokens: number;
      outputTokens: number;
      creditsRate: ModelCreditRate;
    }
  | {
      type: 'content-extraction';
      modelId: string;
      pageCount: number;
      creditsRate: ContentExtractionCreditRate;
    };

export type AiCreditsUsageSource = 'auto-tagging' | 'content-extraction';
