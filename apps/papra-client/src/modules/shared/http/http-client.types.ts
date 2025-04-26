import type { Expand } from '@corentinth/chisels';

export type AsDto<T> = Expand<{
  [K in keyof T]: T[K] extends Date ? string : T[K];
}>;
