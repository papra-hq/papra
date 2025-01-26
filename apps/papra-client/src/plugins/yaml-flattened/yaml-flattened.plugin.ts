import type { Plugin } from 'vite';
import { flattenYaml } from './yaml-flattened.models';

export function yamlFlattenPlugin(): Plugin {
  return {
    name: 'vite-plugin-yaml-flatten',
    enforce: 'pre',

    async transform(code, id) {
      if (id.endsWith('.yml?flattened') || id.endsWith('.yaml?flattened')) {
        const flattenedData = flattenYaml({ code });

        return {
          code: `export default ${JSON.stringify(flattenedData)};`,
          map: null,
        };
      }
      return null;
    },
  };
}
