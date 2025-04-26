/* eslint-disable no-console */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cwd as getCwd } from 'node:process';
import { parse } from 'yaml';

export async function generateI18nTypes({ cwd = getCwd() }: { cwd?: string } = {}) {
  try {
    const yamlPath = path.join(cwd, 'src/locales/en.yml');
    const outputPath = path.join(cwd, 'src/modules/i18n/locales.types.ts');

    const enLocales = await readFile(yamlPath, 'utf-8');
    const parsedLocales = parse(enLocales);
    const localKeys = Object.keys(parsedLocales);

    const localesTypeDefinition = `
// Do not manually edit this file.
// This file is dynamically generated when the dev server runs (or using the \`pnpm script:generate-i18n-types\` command).
// Keys are extracted from the en.yml file.
// Source code : ${path.relative(cwd, __filename)}

export type LocaleKeys =\n${localKeys.map(key => `  | '${key}'`).join('\n')};
`.trimStart();

    await writeFile(outputPath, localesTypeDefinition);
    console.log('✅ Successfully generated i18n types');
  } catch (error) {
    console.error('❌ Error generating i18n types:', error);
  }
}
