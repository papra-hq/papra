import path from 'node:path';
import unoCssPlugin from 'unocss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { version } from './package.json';
import { i18nTypesPlugin } from './src/plugins/i18n-types/i18n-types.plugin';
import { yamlPlugin } from './src/plugins/yaml/yaml.plugin';

export default defineConfig({
  plugins: [
    yamlPlugin(),
    unoCssPlugin(),
    solidPlugin(),
    i18nTypesPlugin(),
  ],
  define: {
    'import.meta.env.VITE_PAPRA_VERSION': JSON.stringify(version),
  },
  server: {
    port: 3000,
    proxy: {
      '/api/': {
        target: 'http://localhost:1221',
      },
    },
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@pdfslick/solid'],
  },
  // test: {
  //   exclude: [...configDefaults.exclude, '**/*.e2e.test.ts'],
  // },
});
