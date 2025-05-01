import type { CliConfig } from './config.schemas';
import fs from 'node:fs/promises';
import { dirname } from 'node:path';
import * as v from 'valibot';
import { getConfigFilePath } from './appdata';
import { cliConfigSchema } from './config.schemas';

export async function getConfig(): Promise<CliConfig> {
  const configFilePath = getConfigFilePath();
  const fileExists = await fs.access(configFilePath).then(() => true).catch(() => false);

  if (!fileExists) {
    return {};
  }

  const config = await fs.readFile(configFilePath, 'utf-8');
  return v.parse(cliConfigSchema, JSON.parse(config));
}

export async function setConfig(rawConfig: CliConfig) {
  const config = v.parse(cliConfigSchema, rawConfig);

  const configFilePath = getConfigFilePath();
  const dir = dirname(configFilePath);

  // ensure directory exists
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(configFilePath, JSON.stringify(config, null, 2));
}

export async function updateConfig(fn: (config: CliConfig) => CliConfig) {
  const currentConfig = await getConfig();
  const newConfig = fn(currentConfig);

  await setConfig(newConfig);

  return newConfig;
}
