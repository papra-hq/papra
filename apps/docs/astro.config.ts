import { env } from 'node:process';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';
import starlightThemeRapide from 'starlight-theme-rapide';
import UnoCSS from 'unocss/astro';
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
    UnoCSS(),
    starlight({
      plugins: [starlightThemeRapide(), starlightLinksValidator({ exclude: ['http://localhost:1221'] })],
      title: 'Papra Docs',
      logo: {
        dark: './src/assets/logo-dark.svg',
        light: './src/assets/logo-light.svg',
        alt: 'Papra Logo',
      },
      social: [
        { href: 'https://github.com/papra-hq/papra', icon: 'github', label: 'GitHub' },
        { href: 'https://bsky.app/profile/papra.app', icon: 'blueSky', label: 'BlueSky' },
        { href: 'https://papra.app/discord', icon: 'discord', label: 'Discord' },
      ],
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
