export type ModelConfig = {
  modelName: string;
  adapterId?: string;
};

export type ModelUsage = {
  inputTokens: number;
  outputTokens: number;
};
