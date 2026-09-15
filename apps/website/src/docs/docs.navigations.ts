import type { DocsCategory } from './docs.types';

// Organize by reader intent; see README.md for category boundaries.
export const docCategories: DocsCategory[] = [
  {
    titleKey: 'docs.categories.overview',
    sections: [
      {
        titleKey: 'docs.sections.getting-started',
        items: [{ docId: 'index' }],
      },
    ],
  },
  {
    titleKey: 'docs.categories.user-guide',
    sections: [
      {
        titleKey: 'docs.sections.getting-started',
        items: [{ docId: 'user-guide/introduction' }],
      },
    ],
  },
  {
    titleKey: 'docs.categories.self-hosting',
    sections: [
      {
        titleKey: 'docs.sections.getting-started',
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
        titleKey: 'docs.sections.installation',
        items: [
          {
            docId: 'self-hosting/installation/docker',
          },
        ],
      },
      {
        titleKey: 'docs.sections.platforms',
        items: [
          {
            docId: 'self-hosting/installation/umbrel',
          },
        ],
      },
    ],
  },
  {
    titleKey: 'docs.categories.developers',
    sections: [
      {
        titleKey: 'docs.sections.getting-started',
        items: [{ docId: 'developers/introduction' }],
      },
      {
        titleKey: 'docs.sections.api-reference',
        items: [
          {
            docId: 'api-reference/authentication',
          },
        ],
      },
    ],
  },
  {
    titleKey: 'docs.categories.concepts',
    sections: [
      {
        titleKey: 'docs.sections.overview',
        items: [{ docId: 'concepts/introduction' }],
      },
    ],
  },
];
