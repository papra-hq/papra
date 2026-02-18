import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    isolate: false,
    env: {
      TZ: 'UTC',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
