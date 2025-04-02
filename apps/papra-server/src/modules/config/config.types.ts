import type { parseConfig } from './config';

export type Config = Awaited<ReturnType<typeof parseConfig>>['config'];
