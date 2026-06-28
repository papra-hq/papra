export const AI_ADAPTERS = {
  ollama: 'ollama',
  openai: 'openai',
  mistral: 'mistral',
} as const;

export const AI_ADAPTERS_NAMES = Object.values(AI_ADAPTERS);
export type AiAdapterName = (typeof AI_ADAPTERS_NAMES)[number];
