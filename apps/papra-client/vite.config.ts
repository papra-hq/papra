import type { Plugin } from 'vite';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { env } from 'node:process';
import unoCssPlugin from 'unocss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const isDemoMode = env.VITE_IS_DEMO_MODE === 'true';

const pdfjsAssetsDirectory = getPdfjsAssetsDirectoryPath();

export default defineConfig({
  plugins: [
    unoCssPlugin(),
    solidPlugin(),
    cleanDemoAssetsPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: path.join(pdfjsAssetsDirectory, 'cmaps'),
          dest: 'pdfjs-assets/cmaps',
          rename: { stripBase: true },
        },
        {
          src: path.join(pdfjsAssetsDirectory, 'standard_fonts'),
          dest: 'pdfjs-assets/standard_fonts',
          rename: { stripBase: true },
        },
      ],
    }),
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

function getPdfjsAssetsDirectoryPath(): string {
  const require = createRequire(import.meta.url);
  const pdfjsDistDir = path.dirname(
    require.resolve('pdfjs-dist/package.json', {
      paths: [require.resolve('@pdfslick/core/package.json')],
    }),
  );
  return pdfjsDistDir;
}

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
