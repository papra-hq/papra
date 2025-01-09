import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro';

export default defineConfig({
  site: 'https://docs.papra.app',

  integrations: [
    UnoCSS({
      injectReset: true,
    }),
    sitemap(),
  ],

  markdown: {

    shikiConfig: {
      themes: {
        light: 'vitesse-light',
        dark: 'vitesse-dark',
      },
    },
  },
});
