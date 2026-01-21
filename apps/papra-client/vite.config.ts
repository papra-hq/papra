import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from 'node:process';
import unoCssPlugin from 'unocss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const isDemoMode = env.VITE_IS_DEMO_MODE === 'true';

export default defineConfig({
  plugins: [
    unoCssPlugin(),
    solidPlugin(),
    cleanDemoAssetsPlugin(),
  ],
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

function cleanDemoAssetsPlugin(): Plugin {
  return {
    name: 'clean-demo-assets',
    closeBundle() {
      if (!isDemoMode) {
        const startedAt = Date.now();
        const distDir = path.resolve(__dirname, 'dist/assets');
        const files = fs.readdirSync(distDir);

        const demoPdfPattern = /\d{3}\.demo-document\.file-.+$/;

        files.forEach((file) => {
          if (demoPdfPattern.test(file)) {
            const filePath = path.join(distDir, file);
            fs.unlinkSync(filePath);
          }
        });
        const duration = Date.now() - startedAt;
        console.log(`[clean-demo-assets] Removed demo documents from build output in ${duration}ms`);
      }
    },
  };
}
