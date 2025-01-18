import { env } from 'node:process';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightThemeRapide from 'starlight-theme-rapide';
import { sidebar } from './src/content/navigation';

const plausibleDomain = env.PLAUSIBLE_DOMAIN;
const plausibleScriptSrc = env.PLAUSIBLE_SCRIPT_SRC;
const isPlausibleEnabled = plausibleDomain && plausibleScriptSrc;

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
        ...(isPlausibleEnabled
          ? [
              {
                tag: 'script',
                attrs: {
                  'defer': true,
                  'data-domain': plausibleDomain,
                  'src': plausibleScriptSrc,
                },
              } as const,
            ]
          : []),
      ],
      customCss: ['./src/assets/app.css'],
    }),
  ],
});
