import { env } from 'node:process';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightThemeRapide from 'starlight-theme-rapide';
import { sidebar } from './src/content/navigation';
import posthogRawScript from './src/scripts/posthog.script.js?raw';

const posthogApiKey = env.POSTHOG_API_KEY;
const posthogApiHost = env.POSTHOG_API_HOST ?? 'https://eu.i.posthog.com';
const isPosthogEnabled = Boolean(posthogApiKey);

const posthogScript = posthogRawScript.replace('[POSTHOG-API-KEY]', posthogApiKey ?? '').replace('[POSTHOG-API-HOST]', posthogApiHost);

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
        github: 'https://github.com/papra-hq/papra',
        blueSky: 'https://bsky.app/profile/papra.app',
        discord: 'https://discord.gg/8UPjzsrBNF',
      },
      expressiveCode: {
        themes: ['vitesse-black', 'vitesse-light'],
      },
      editLink: {
        baseUrl: 'https://github.com/papra-hq/papra/edit/main/apps/docs/',
      },
      sidebar,
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
        ...(isPosthogEnabled
          ? [
              {
                tag: 'script',
                content: posthogScript,
              } as const,
            ]
          : []),
      ],
      customCss: ['./src/assets/app.css'],
    }),
  ],
});
