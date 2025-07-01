import type { StarlightUserConfig } from '@astrojs/starlight/types';

export const sidebar = [
  {
    label: 'Getting Started',
    items: [
      { label: 'Introduction', slug: '' },
    ],
  },
  {
    label: 'Self Hosting',
    items: [
      { label: 'Using Docker', slug: 'self-hosting/using-docker' },
      { label: 'Using Docker Compose', slug: 'self-hosting/using-docker-compose' },
      { label: 'Docker Compose Generator', link: '/docker-compose-generator', badge: { text: 'new', variant: 'note' } },
      { label: 'Configuration', slug: 'self-hosting/configuration' },
    ],
  },
  {
    label: 'Guides',
    items: [
      {
        label: 'Setup intake emails with OwlRelay',
        slug: 'guides/intake-emails-with-owlrelay',
      },
      {
        label: 'Setup intake emails with CF Email Workers',
        slug: 'guides/intake-emails-with-cloudflare-email-workers',
      },
      {
        label: 'Setup Ingestion Folder',
        slug: 'guides/setup-ingestion-folder',
      },
      {
        label: 'Setup Custom OAuth2 Providers',
        slug: 'guides/setup-custom-oauth2-providers',
      },
    ],
  },
  {
    label: 'Resources',
    items: [
      {
        label: 'Troubleshooting',
        slug: 'resources/troubleshooting',
      },
      {
        label: 'CLI Documentation',
        slug: 'resources/cli',
      },
      {
        label: 'Security Policy',
        link: 'https://github.com/papra-hq/papra/blob/main/SECURITY.md',
        attrs: {
          target: '_blank',
        },
      },
      {
        label: 'API Endpoints',
        slug: 'resources/api-endpoints',
      },
    ],
  },
] satisfies StarlightUserConfig['sidebar'];
