import type { TranslationsDictionary } from '../i18n/i18n.types';

export type DocsCategory = {
  titleKey: Extract<keyof TranslationsDictionary, `docs.${string}`>;
  sections: DocsSection[];
};

export type DocsSection = {
  titleKey: Extract<keyof TranslationsDictionary, `docs.${string}`>;
  items: DocsItem[];
};

export type DocsItem = {
  docId: string;
};
