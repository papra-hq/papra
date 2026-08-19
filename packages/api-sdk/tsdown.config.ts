import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  dts: {
    eager: true,
  },
  exports: true,
  deps: {
    alwaysBundle: ['@papra/app-server'],
    dts: {
      alwaysBundle: ['@papra/app-server'],
    },
  },
});
