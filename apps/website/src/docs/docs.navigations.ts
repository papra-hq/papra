import type { DocsCategory } from './docs.types';

export const docCategories: DocsCategory[] = [
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
    titleKey: 'docs.categories.api-reference',
    sections: [
      {
        titleKey: 'docs.sections.authentication',
        items: [
          {
            docId: 'api-reference/authentication',
          },
        ],
      },
    ],
  },
];
