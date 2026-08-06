import type { DocsItem } from './docs.types';

export function getItemUrl(item: DocsItem): string {
  return `/docs/${item.docId}`;
}
