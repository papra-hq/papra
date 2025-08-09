/* eslint-disable no-console */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const currentFile = fileURLToPath(import.meta.url);
const packageRoot = join(dirname(currentFile), '..', '..', '..');

export async function generateI18nTypes() {
  try {
    const yamlPath = join(packageRoot, 'src/locales/en.yml');
    const outputPath = join(packageRoot, 'src/modules/i18n/locales.types.ts');

    const enLocales = await readFile(yamlPath, 'utf-8');
    const parsedLocales = parse(enLocales);
    const localKeys = Object.keys(parsedLocales);

    const localesTypeDefinition = `
// Do not manually edit this file.
// This file is dynamically generated when the dev server runs (or using the \`pnpm script:generate-i18n-types\` command).
// Keys are extracted from the en.yml file.
// Source code : ${relative(packageRoot, currentFile)}

export type LocaleKeys =\n${localKeys.map(key => `  | '${key}'`).join('\n')};
`.trimStart();

    await writeFile(outputPath, localesTypeDefinition);
    console.log('✅ Successfully generated i18n types');
  } catch (error) {
    console.error('❌ Error generating i18n types:', error);
  }
}
