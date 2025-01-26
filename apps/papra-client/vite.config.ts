import path from 'node:path';
import unoCssPlugin from 'unocss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { version } from './package.json';
import { yamlFlattenPlugin } from './src/plugins/yaml-flattened/yaml-flattened.plugin';

export default defineConfig({
  plugins: [
    yamlFlattenPlugin(),
    unoCssPlugin(),
    solidPlugin(),
  ],
  define: {
    'import.meta.env.VITE_PAPRA_VERSION': JSON.stringify(version),
  },
  server: {
    port: 3000,
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
