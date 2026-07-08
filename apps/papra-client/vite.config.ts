/// <reference types="vitest/config" />
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
    apiChaosPlugin(),
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
  test: {
    isolate: false,
    environment: 'node',
    env: {
      TZ: 'UTC',
    },
  },
});

/**
 * Dev-only chaos middleware to reproduce production-like network conditions:
 * - CHAOS_DELAY: latency in ms added to matching /api requests (default 2000, only active when CHAOS_DELAY or CHAOS_SLOW is set)
 * - CHAOS_SLOW: regex of paths to delay (default '/api/organizations/org_')
 * - CHAOS_FAIL: regex of paths to fail with a 500
 *
 * Example: CHAOS_DELAY=2000 pnpm dev
 */
function apiChaosPlugin(): Plugin {
  return {
    name: 'api-chaos',
    apply: 'serve',
    configureServer(server) {
      const isEnabled = true;

      if (!isEnabled) {
        return;
      }

      const delayMs = Number(env.CHAOS_DELAY ?? 500);
      const slowPattern = new RegExp(env.CHAOS_SLOW ?? '/api/organizations/org_');
      const failPattern = env.CHAOS_FAIL ? new RegExp(env.CHAOS_FAIL) : null;

      // oxlint-disable-next-line no-console
      console.log(
        `[api-chaos] enabled — delaying ${slowPattern} by ~${delayMs}ms${failPattern ? `, failing ${failPattern}` : ''}`,
      );

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        if (failPattern?.test(req.url)) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end('{"error":{"message":"chaos","code":"chaos"}}');
          return;
        }

        if (slowPattern.test(req.url)) {
          // Jitter so concurrent queries resolve in varying orders, like production
          setTimeout(next, delayMs + Math.random() * 500);
          return;
        }

        next();
      });
    },
  };
}

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
    apply: 'build',
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
        // oxlint-disable-next-line no-console
        console.log(
          `[clean-demo-assets] Removed demo documents from build output in ${duration}ms`,
        );
      }
    },
  };
}
