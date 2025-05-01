import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    'src/cli',
  ],
  clean: true,
  declaration: true,
  sourcemap: true,
  rollup: {
    emitCJS: true,
  },
});
