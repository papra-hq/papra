import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from 'node:process';
import { createRequire } from 'node:module';
import unoCssPlugin from 'unocss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const isDemoMode = env.VITE_IS_DEMO_MODE === 'true';

export default defineConfig({
  plugins: [
    unoCssPlugin(),
    solidPlugin(),
    cleanDemoAssetsPlugin(),
    copyPdfjsAssetsPlugin(),
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

function copyPdfjsAssetsPlugin(): Plugin {
  return {
    name: 'copy-pdfjs-assets',
    buildStart() {
      const require = createRequire(import.meta.url);
      const pdfjsDistDir = path.dirname(
        require.resolve('pdfjs-dist/package.json', {
          paths: [require.resolve('@pdfslick/core/package.json')]
        })
      );
      const cmapsSrc = path.join(pdfjsDistDir, 'cmaps');
      const standardFontsSrc = path.join(pdfjsDistDir, 'standard_fonts');

      const publicDir = path.resolve(__dirname, 'public/pdfjs-assets');
      const cmapsDest = path.join(publicDir, 'cmaps');
      const standardFontsDest = path.join(publicDir, 'standard_fonts');

      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Construct a helper function to copy dir recursively
      const copyDir = (src: string, dest: string) => {
        if (!fs.existsSync(dest)) { fs.mkdirSync(dest, { recursive: true }); }
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) { copyDir(srcPath, destPath); }
          else { fs.copyFileSync(srcPath, destPath); }
        }
      };

      if (fs.existsSync(cmapsSrc)) {
        copyDir(cmapsSrc, cmapsDest);
        console.log(`[copy-pdfjs-assets] Copied cmaps to public/pdfjs-assets/cmaps`);
      }
      if (fs.existsSync(standardFontsSrc)) {
        copyDir(standardFontsSrc, standardFontsDest);
        console.log(`[copy-pdfjs-assets] Copied standard_fonts to public/pdfjs-assets/standard_fonts`);
      }
    },
  };
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
