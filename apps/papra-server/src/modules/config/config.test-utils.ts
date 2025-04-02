import type { DeepPartial } from '@corentinth/chisels';
import type { Config } from './config.types';
import { merge } from 'lodash-es';
import { loadDryConfig } from './config';

export { overrideConfig };

function overrideConfig(config: DeepPartial<Config>) {
  const { config: defaultConfig } = loadDryConfig();

  return merge({}, defaultConfig, config);
}
