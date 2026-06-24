import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

const loadedEnv = loadEnv('test', process.cwd(), 'TEST_');

export default defineConfig({
  test: {
    isolate: false,
    env: {
      TZ: 'UTC',
      ...loadedEnv,
    },
  },
});
