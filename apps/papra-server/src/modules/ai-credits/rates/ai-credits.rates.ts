export type ModelCreditRate = {
  creditsPerMillionInputTokens: number;
  creditsPerMillionOutputTokens: number;
};

export type ContentExtractionCreditRate = {
  creditsPerPage: number;
};

export const modelCreditRates: Record<string, ModelCreditRate> = {
  // checked on 2026-07-22 https://mistral.ai/pricing/api/
  'mistral://mistral-medium-3-5': {
    creditsPerMillionInputTokens: 15_000,
    creditsPerMillionOutputTokens: 75_000,
  },
  // checked on 2026-07-22 https://mistral.ai/pricing/api/
  'mistral://mistral-small-2603': {
    creditsPerMillionInputTokens: 1_500,
    creditsPerMillionOutputTokens: 6_000,
  },
};

// TODO: handle content extraction credit
// export const contentExtractionCreditRates: Record<string, ContentExtractionCreditRate> = {
//   // checked on 2026-07-22 https://mistral.ai/pricing/api/
//   'mistral-ocr': {
//     creditsPerPage: 40,
//   },
// };
