import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';
import astroExpressiveCode from 'astro-expressive-code';
import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro';
import { config } from './src/app.config';

import { DEFAULT_LOCALE, LOCALES } from './src/i18n/i18n.constants';
import createRedirectsFile from './src/plugins/redirects';

export default defineConfig({
  site: 'https://papra.app',

  integrations: [
    UnoCSS({ injectReset: true }),
    sitemap(),
    createRedirectsFile({
      redirects: {
        '/discord': { status: 302, destination: config.discordInvite },
        '/support': { status: 302, destination: config.sponsorLink },
      },
    }),
    astroExpressiveCode({
      themes: ['vitesse-dark', 'github-light'],
      styleOverrides: {
        frames: {
          shadowColor: 'transparent',
        },
      },
      defaultProps: {
        overridesByLang: {
          'bash,sh,shell': {
            frame: 'none',
          },
        },
      },
    }),
    mdx(),
  ],

  output: 'static',

  // We don't need sessions, and to prevent cf from provisionning a KV store for us, we use the null driver.
  session: { driver: { entrypoint: 'unstorage/drivers/null' } },

  adapter: cloudflare({
    // Keep build-time (sharp) image optimization for the static site instead of
    // the v14 default 'cloudflare-binding' runtime image service.
    imageService: 'compile',
  }),

  // Astro v7 changed the default to 'jsx' (strips whitespace between inline
  // elements like React). Keep the previous behavior to avoid layout regressions.
  compressHTML: true,

  i18n: {
    locales: LOCALES.map((locale) => locale), // Because astro expects string[] and not readonly string[]
    defaultLocale: DEFAULT_LOCALE,
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
});
