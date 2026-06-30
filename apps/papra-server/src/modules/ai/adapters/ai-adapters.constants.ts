import { objectKeys } from '@papra/std';
import { OPENAI_COMPATIBLE_ADAPTERS } from './openai-compatible/openai-compatible.providers';

export const AI_ADAPTERS_NAMES = objectKeys(OPENAI_COMPATIBLE_ADAPTERS);
export type AiAdapterName = (typeof AI_ADAPTERS_NAMES)[number];

export const AI_DEFAULT_ADAPTER_NAME = 'openai' satisfies AiAdapterName;
