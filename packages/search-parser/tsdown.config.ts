import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  dts: { sourcemap: true },
  sourcemap: true,
  clean: true,
  exports: true, // auto update the package.json exports, main, module and types fields
});
