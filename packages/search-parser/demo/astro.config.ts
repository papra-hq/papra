import solidJs from '@astrojs/solid-js';
import { defineConfig } from 'astro/config';
import unoCss from 'unocss/astro';

export default defineConfig({
  integrations: [
    unoCss({ injectReset: true }),
    solidJs(),
  ],
});
