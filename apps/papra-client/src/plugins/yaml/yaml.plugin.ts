import type { Plugin } from 'vite';
import { parse } from 'yaml';

export function yamlPlugin(): Plugin {
  return {
    name: 'vite-plugin-yaml',
    enforce: 'pre',

    async transform(code, id) {
      if (id.endsWith('.yml') || id.endsWith('.yaml')) {
        return {
          code: `export default ${JSON.stringify(parse(code))};`,
          map: null,
        };
      }
      return null;
    },
  };
}
