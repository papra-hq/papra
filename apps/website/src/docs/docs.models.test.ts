import type { CollectionEntry } from 'astro:content';
import { describe, expect, test } from 'vitest';
import {
  getDocContext,
  getDocEditUrl,
  getDocPagination,
  getDocStaticPaths,
  getDocUrl,
  resolveDoc,
} from './docs.models';

function doc(id: string, title = id): CollectionEntry<'docs'> {
  return {
    id,
    collection: 'docs',
    filePath: `src/docs/content/${id}.mdx`,
    data: { title, description: title },
  };
}

const docs = [
  doc('en/self-hosting/getting-started', 'Getting started'),
  doc('en/self-hosting/installation/docker', 'Docker'),
  doc('fr/self-hosting/getting-started', 'Bien démarrer'),
];

describe('getDocUrl', () => {
  test('prefixes the docs landing page with the default locale', () => {
    expect(getDocUrl()).toBe('/en/docs');
    expect(getDocUrl({ locale: 'fr' })).toBe('/fr/docs');
  });

  test('keeps nested logical IDs independent of the locale', () => {
    expect(getDocUrl({ docId: 'self-hosting/installation/docker' })).toBe(
      '/en/docs/self-hosting/installation/docker',
    );
    expect(getDocUrl({ docId: 'self-hosting/installation/docker', locale: 'fr' })).toBe(
      '/fr/docs/self-hosting/installation/docker',
    );
  });
});

describe('getDocEditUrl', () => {
  test.each([
    ['en', 'self-hosting/installation/docker', 'en/self-hosting/installation/docker'],
    ['fr', 'self-hosting/getting-started', 'fr/self-hosting/getting-started'],
    ['fr', 'self-hosting/installation/docker', 'en/self-hosting/installation/docker'],
  ] as const)('links to the resolved source for %s/%s', (locale, docId, sourceId) => {
    const { entry } = resolveDoc({ docs, docId, locale });

    expect(getDocEditUrl(entry)).toBe(
      `https://github.com/papra-hq/papra/edit/main/apps/website/src/docs/content/${sourceId}.mdx`,
    );
  });

  test('preserves the source filename and extension and encodes URL-sensitive characters', () => {
    const entry = {
      ...doc('en/unlisted'),
      filePath: 'src/docs/content/en/Unlisted page #1.md',
    };

    expect(getDocEditUrl(entry)).toBe(
      'https://github.com/papra-hq/papra/edit/main/apps/website/src/docs/content/en/Unlisted%20page%20%231.md',
    );
  });

  test('omits the link for entries without a source file', () => {
    expect(getDocEditUrl({ ...doc('en/unlisted'), filePath: undefined })).toBeUndefined();
  });
});

describe('resolveDoc', () => {
  test('resolves English without marking it as a fallback', () => {
    expect(resolveDoc({ docs, docId: 'self-hosting/getting-started' })).toEqual({
      entry: docs[0],
      docId: 'self-hosting/getting-started',
      requestedLocale: 'en',
      contentLocale: 'en',
      isFallback: false,
    });
  });

  test('prefers the requested translation, including its title', () => {
    expect(resolveDoc({ docs, docId: 'self-hosting/getting-started', locale: 'fr' })).toEqual({
      entry: docs[2],
      docId: 'self-hosting/getting-started',
      requestedLocale: 'fr',
      contentLocale: 'fr',
      isFallback: false,
    });
  });

  test('falls back to English without losing the requested locale', () => {
    const resolved = resolveDoc({ docs, docId: 'self-hosting/installation/docker', locale: 'fr' });
    expect(resolved).toEqual({
      entry: docs[1],
      docId: 'self-hosting/installation/docker',
      requestedLocale: 'fr',
      contentLocale: 'en',
      isFallback: true,
    });
    expect(getDocUrl({ docId: resolved.docId, locale: resolved.requestedLocale })).toBe(
      '/fr/docs/self-hosting/installation/docker',
    );
  });

  test('fails explicitly for missing documents', () => {
    expect(() => resolveDoc({ docs, docId: 'missing', locale: 'fr' })).toThrow(
      'Missing English source document: missing',
    );
  });

  test('requires an English source for translations', () => {
    expect(() =>
      resolveDoc({ docs: [docs[2]!], docId: 'self-hosting/getting-started', locale: 'fr' }),
    ).toThrow('Missing English source document');
  });
});

describe('getDocStaticPaths', () => {
  test('publishes only enabled docs locales, even when other translations exist', () => {
    const paths = getDocStaticPaths(docs);
    expect(paths.map(({ params }) => params)).toEqual([
      { locale: 'en', slug: 'self-hosting/getting-started' },
      { locale: 'en', slug: 'self-hosting/installation/docker' },
    ]);
    expect(paths.every(({ props }) => props.alternateLocales.join() === 'en')).toBe(true);
  });

  test('generates translated and fallback pages, advertising only real translations', () => {
    const paths = getDocStaticPaths(docs, ['en', 'fr']);
    expect(paths).toHaveLength(4);
    expect(paths.map(({ params }) => params)).toContainEqual({
      locale: 'fr',
      slug: 'self-hosting/installation/docker',
    });
    expect(
      paths.map(({ props }) => ({
        locale: props.requestedLocale,
        docId: props.docId,
        isFallback: props.isFallback,
        alternateLocales: props.alternateLocales,
      })),
    ).toEqual([
      {
        locale: 'en',
        docId: 'self-hosting/getting-started',
        isFallback: false,
        alternateLocales: ['en', 'fr'],
      },
      {
        locale: 'en',
        docId: 'self-hosting/installation/docker',
        isFallback: false,
        alternateLocales: ['en'],
      },
      {
        locale: 'fr',
        docId: 'self-hosting/getting-started',
        isFallback: false,
        alternateLocales: ['en', 'fr'],
      },
      {
        locale: 'fr',
        docId: 'self-hosting/installation/docker',
        isFallback: true,
        alternateLocales: ['en'],
      },
    ]);
  });

  test('does not generate unknown document routes', () => {
    expect(getDocStaticPaths([])).toEqual([]);
    expect(getDocStaticPaths(docs).some(({ params }) => params.slug === 'missing')).toBe(false);
  });

  test('fails the build for a translation without an English source', () => {
    expect(() => getDocStaticPaths([doc('fr/orphan')])).toThrow(
      'Missing English source document: orphan',
    );
  });
});

describe('docs navigation', () => {
  test('uses locale-independent IDs to find context', () => {
    expect(getDocContext('self-hosting/installation/docker')?.category.titleKey).toBe(
      'docs.categories.self-hosting',
    );
    expect(getDocContext()).toBeUndefined();
    expect(getDocContext('unlisted')).toBeUndefined();
  });

  test('keeps pagination within the current category', () => {
    expect(getDocPagination('self-hosting/getting-started')).toEqual({
      previous: undefined,
      next: { docId: 'self-hosting/chosing-a-method' },
    });
    expect(getDocPagination('self-hosting/installation/umbrel')).toEqual({
      previous: { docId: 'self-hosting/installation/docker' },
      next: undefined,
    });
    expect(getDocPagination('unlisted')).toEqual({ previous: undefined, next: undefined });
  });
});
