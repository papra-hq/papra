import { readFile, writeFile } from 'node:fs/promises';
import { flattenYaml } from '@/plugins/yaml-flattened/yaml-flattened.models';

const enLocales = await readFile('src/locales/en.yml', 'utf-8');
const parsedLocales = flattenYaml({ code: enLocales });

const localKeys = Object.keys(parsedLocales);
const localesTypeDefinition = `
// Dynamically generated file. Use "pnpm script:generate-i18n-types" to update.
export type LocaleKeys = ${localKeys.map(key => `'${key}'`).join(' | ')};
`.trimStart();

await writeFile('src/modules/i18n/locales.types.ts', localesTypeDefinition);

console.log('Successfully generated i18n types');
