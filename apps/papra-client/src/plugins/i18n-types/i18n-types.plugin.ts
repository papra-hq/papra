import type { Plugin } from 'vite';
import path from 'node:path';
import { cwd as getCwd } from 'node:process';
import { generateI18nTypes } from './i18n-types.services';

const cwd = getCwd();

export function i18nTypesPlugin(): Plugin {
  return {
    name: 'vite-plugin-i18n-types',
    configureServer(server) {
      server.watcher.add(path.join(cwd, 'src/locales/en.yml'));
      server.watcher.on('change', (changedPath) => {
        if (changedPath.endsWith('en.yml')) {
          generateI18nTypes();
        }
      });
    },
    buildStart() {
      generateI18nTypes();
    },
  };
}
