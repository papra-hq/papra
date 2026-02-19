import type { ConfigDefinition } from 'figue';
import type { parseConfig } from './config';

export type Config = Awaited<ReturnType<typeof parseConfig>>['config'];

export type AppConfigDefinition = ConfigDefinition<{ showInDocumentation?: boolean }>;
