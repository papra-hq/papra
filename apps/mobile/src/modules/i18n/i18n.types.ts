import type { en as enMessages } from './translations/en';

export type AppMessages = typeof enMessages;

export type PartialMessages<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]?: PartialMessages<T[K]> }
    : T;
