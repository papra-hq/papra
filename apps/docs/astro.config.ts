import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightThemeRapide from 'starlight-theme-rapide';

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.papra.app',
  integrations: [
    starlight({
      plugins: [starlightThemeRapide()],
      title: 'Papra Docs',
      logo: {
        dark: './src/assets/logo-dark.svg',
        light: './src/assets/logo-light.svg',
        alt: 'Papra Logo',
      },
      social: {
        blueSky: 'https://bsky.app/profile/papra.app',
        github: 'https://github.com/papra-hq/papra',
      },
      editLink: {
        baseUrl: 'https://github.com/papra-hq/papra/edit/main/apps/docs/',
      },
      sidebar: [
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
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'Environment variables', slug: 'configuration/environment-variables' },
          ],
        },
      ],
      favicon: '/favicon.svg',
      head: [
        // Add ICO favicon fallback for Safari.
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            href: '/favicon.ico',
            sizes: '32x32',
          },
        },
      ],
      customCss: ['./src/assets/app.css'],
    }),
  ],
});
