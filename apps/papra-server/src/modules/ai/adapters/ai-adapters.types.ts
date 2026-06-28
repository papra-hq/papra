import type { AnyTextAdapter } from '@tanstack/ai';
import type { Config } from '../../config/config.types';

export type AiTextAdapter = AnyTextAdapter;

export type AiAdapter = {
  name: string;
  getTextAdapter: (args: { modelName: string }) => AiTextAdapter;
};

export type AiAdapterFactory = (args: { config: Config }) => AiAdapter;
