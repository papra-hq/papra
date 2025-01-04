import type { parseConfig } from './config';

export type Config = ReturnType<typeof parseConfig>['config'];
