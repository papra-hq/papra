import type { OpenAiCompatibleAdapterDefinition } from './openai-compatible.types';

export const OPENAI_COMPATIBLE_ADAPTERS = {
  openai: {
    label: 'OpenAI',
    envPrefix: 'OPENAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
  },
  mistral: {
    label: 'Mistral',
    envPrefix: 'MISTRAL',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
  },
  deepseek: {
    label: 'DeepSeek',
    envPrefix: 'DEEPSEEK',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
  },
  openrouter: {
    label: 'OpenRouter',
    envPrefix: 'OPENROUTER',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
  },
  ollama: {
    label: 'Ollama',
    envPrefix: 'OLLAMA',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultApiKey: 'ollama',
  },
  lmstudio: {
    label: 'LM Studio',
    envPrefix: 'LMSTUDIO',
    defaultBaseUrl: 'http://localhost:1234/v1',
    defaultApiKey: 'lm-studio',
  },
  vllm: {
    label: 'vLLM',
    envPrefix: 'VLLM',
    defaultBaseUrl: 'http://localhost:8000/v1',
    defaultApiKey: 'not-needed',
  },
  cocore: {
    label: 'co/core',
    envPrefix: 'COCORE',
    defaultBaseUrl: 'https://cocore.dev/api/v1',
  },
} as const satisfies Record<string, OpenAiCompatibleAdapterDefinition>;
