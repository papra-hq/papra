import path from 'node:path';
import unoCssPlugin from 'unocss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { version } from './package.json';

export default defineConfig({
  plugins: [
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
