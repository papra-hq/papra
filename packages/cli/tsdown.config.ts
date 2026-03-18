import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  entry: ['./src/cli.ts'],
  // dts: { sourcemap: true },
  // sourcemap: true,
  // clean: true,
  // exports: true, // auto update the package.json exports, main, module and types fields
  exe: true,
  deps: {
    alwaysBundle: Object.keys(pkg.dependencies ?? {}),
  },
});
