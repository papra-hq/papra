import type { DeepPartial } from '@corentinth/chisels';
import type { Config } from './config.types';
import { merge } from 'lodash-es';
import { parseConfig } from './config';

export { overrideConfig };

async function overrideConfig(config: DeepPartial<Config>) {
  const { config: defaultConfig } = await parseConfig();

  return merge({}, defaultConfig, config);
}
