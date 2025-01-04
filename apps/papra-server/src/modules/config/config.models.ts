import type { Context } from '../app/server.types';

export function getConfig({ context }: { context: Context }) {
  const config = context.get('config');

  if (!config) {
    throw new Error('Config not found, getConfig must be called after the config middleware.');
  }

  return { config };
}
