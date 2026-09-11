import type { CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/i18n.constants';
import type { DocsItem } from './docs.types';
import { buildLocalizedPath } from '../i18n/i18n';
import { DEFAULT_LOCALE } from '../i18n/i18n.constants';
import { DOCS_LOCALES } from './docs.constants';
import { docCategories } from './docs.navigations';

// Navigation membership determines context, not the document's path hierarchy.
// The docs landing page and unlisted documents have no active context.
export function getDocContext(docId?: string) {
  if (!docId) {
    return undefined;
  }

  for (const category of docCategories) {
    for (const section of category.sections) {
      const item = section.items.find((item) => item.docId === docId);

      if (item) {
        return { category, section, item };
      }
    }
  }

  return undefined;
}

export function getDocPagination(docId: string): {
  previous: DocsItem | undefined;
  next: DocsItem | undefined;
} {
  const context = getDocContext(docId);

  if (!context) {
    return { previous: undefined, next: undefined };
  }

  const items = context.category.sections.flatMap((section) => section.items);
  const currentIndex = items.indexOf(context.item);

  return {
    previous: items[currentIndex - 1],
    next: items[currentIndex + 1],
  };
}

export function getDocUrl({
  docId,
  locale = DEFAULT_LOCALE,
}: { docId?: string; locale?: Locale } = {}): string {
  return buildLocalizedPath({ locale, path: docId ? `/docs/${docId}` : '/docs' });
}

// Collection IDs include the locale; navigation and public helpers use logical IDs.
export function resolveDoc({
  docs,
  docId,
  locale = DEFAULT_LOCALE,
}: {
  docs: CollectionEntry<'docs'>[];
  docId: string;
  locale?: Locale;
}) {
  const source = docs.find((doc) => doc.id === `${DEFAULT_LOCALE}/${docId}`);

  if (!source) {
    throw new Error(`Missing English source document: ${docId}`);
  }

  const translation = docs.find((doc) => doc.id === `${locale}/${docId}`);

  return {
    entry: translation ?? source,
    docId,
    requestedLocale: locale,
    contentLocale: translation ? locale : DEFAULT_LOCALE,
    isFallback: !translation,
  };
}

export function getDocStaticPaths(
  docs: CollectionEntry<'docs'>[],
  locales: readonly Locale[] = DOCS_LOCALES,
) {
  const docIds = [...new Set(docs.map((doc) => doc.id.slice(doc.id.indexOf('/') + 1)))];

  return locales.flatMap((locale) =>
    docIds.map((docId) => ({
      params: { locale, slug: docId },
      props: {
        ...resolveDoc({ docs, docId, locale }),
        alternateLocales: locales.filter((candidate) =>
          docs.some((doc) => doc.id === `${candidate}/${docId}`),
        ),
      },
    })),
  );
}
