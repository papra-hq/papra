import type { AnyTextAdapter } from '@tanstack/ai';
import type { Config } from '../../config/config.types';

export type AiAdapter = {
  name: string;
  getTextAdapter: (args: { modelName: string }) => AnyTextAdapter;
  extractTextFromDocument?: (args: { file: File }) => Promise<{ text: string }>;
};

export type AiAdapterFactory = (args: { config: Config }) => AiAdapter;
