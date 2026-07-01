import { objectKeys } from '@papra/std';
import { OPENAI_COMPATIBLE_ADAPTERS } from './openai-compatible/openai-compatible.providers';

export const AI_ADAPTERS_NAMES = [...objectKeys(OPENAI_COMPATIBLE_ADAPTERS), 'anthropic'] as const;
export type AiAdapterName = (typeof AI_ADAPTERS_NAMES)[number];
