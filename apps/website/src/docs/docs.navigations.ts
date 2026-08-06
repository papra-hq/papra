import type { DocsCategory } from './docs.types';

export const docCategories: DocsCategory[] = [
  {
    title: 'Self-hosting',
    sections: [
      {
        title: 'Getting Started',
        items: [
          {
            docId: 'self-hosting/getting-started',
          },
          {
            docId: 'self-hosting/chosing-a-method',
          },
        ],
      },
      {
        title: 'Installation',
        items: [
          {
            docId: 'self-hosting/installation/docker',
          },
        ],
      },
      {
        title: 'Platforms',
        items: [
          {
            docId: 'self-hosting/installation/umbrel',
          },
        ],
      },
    ],
  },
  {
    title: 'API Reference',
    sections: [
      {
        title: 'Authentication',
        items: [
          {
            docId: 'api-reference/authentication',
          },
        ],
      },
    ],
  },
];

export const flattenedDocs = docCategories.flatMap((category) =>
  category.sections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      category: category.title,
      section: section.title,
    })),
  ),
);
