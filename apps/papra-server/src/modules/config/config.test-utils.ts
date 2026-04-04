import type { DeepPartial } from '@corentinth/chisels';
import type { Config } from './config.types';
import { loadDryConfig } from './config';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const targetVal = result[key];
    const sourceVal = source[key];

    if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }

  return result as T;
}

export function overrideConfig(config: DeepPartial<Config> | undefined = {}): Config {
  const { config: defaultConfig } = loadDryConfig();

  return deepMerge(defaultConfig, config);
}
