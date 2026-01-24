import type { translations as defaultTranslations } from '../locales/en';

type Widen<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : T extends Array<infer U> ? Array<Widen<U>> : T extends object ? { [K in keyof T]: Widen<T[K]> } : T;

export type TranslationsDictionary = {
  [K in keyof typeof defaultTranslations]: Widen<typeof defaultTranslations[K]>;
};
