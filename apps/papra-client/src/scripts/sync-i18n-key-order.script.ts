import * as fs from 'node:fs';
import * as path from 'node:path';

const dirname = path.dirname(new URL(import.meta.url).pathname);

function getLineKey({ line }: { line: string }) {
  return line.split(': ')[0].trim();
}

function isNonTranslationLine(line: string) {
  const trimmedLine = line.trim();

  const isEmptyLine = trimmedLine === '';
  const isExportLine = trimmedLine.startsWith('export');
  const isClosingLine = trimmedLine.startsWith('}');
  const isOpeningLine = trimmedLine.startsWith('{');
  const isImportLine = trimmedLine.startsWith('import');

  return !isExportLine && !isClosingLine && !isOpeningLine && !isImportLine && !isEmptyLine;
}

function indexLinesByKeys(tsContent: string) {
  const lines = tsContent.split('\n');
  const indexedLines: Record<string, string> = {};

  for (const line of lines.filter(isNonTranslationLine)) {
    const key = getLineKey({ line });
    indexedLines[key] = line.trim();
  }

  return indexedLines;
}

function syncLocaleFiles() {
  const localesDir = path.join(dirname, '..', 'locales');
  const enFile = path.join(localesDir, 'en.dictionary.ts');
  const enContent = fs.readFileSync(enFile, 'utf8');
  const enLines = enContent.trim().split('\n');

  const files = fs
    .readdirSync(localesDir)
    .filter(file => file.endsWith('.dictionary.ts') && file !== 'en.dictionary.ts');

  for (const file of files) {
    const targetFile = path.join(localesDir, file);
    console.log(`Syncing ${file} with en.dictionary.ts`);

    const targetContent = fs.readFileSync(targetFile, 'utf8');
    const targetLines = indexLinesByKeys(targetContent);

    const newLocalesContent = enLines
      .filter(line => !line.startsWith('export') && !line.startsWith('}'))
      .map((enLine) => {
        // Reflect empty lines from en.yml
        if (enLine.trim() === '') {
          return '';
        }

        const targetLine = targetLines[getLineKey({ line: enLine })];

        // If a translation key exists in the target file, use it
        if (targetLine) {
          const enLineIndentation = enLine.match(/^(\s*)/)?.[1]?.length ?? 0;
          const targetLineIndentation = targetLine.match(/^(\s*)/)?.[1]?.length ?? 0;

          return `${' '.repeat(enLineIndentation - targetLineIndentation)}${targetLine}`;
        }

        // Reflect comments from en.yml
        if (enLine.trim().startsWith('//')) {
          return enLine;
        }

        // If the translation key does not exist in the target file, add a comment with the one from en.yml
        return `// ${enLine}`;
      });

    const newContent = [
      `import type { TranslationsDictionary } from '@/modules/i18n/locales.types';`,
      '',
      `export const translations: Partial<TranslationsDictionary> = {`,
      ...newLocalesContent,
      `};`,
      '',
    ];

    fs.writeFileSync(targetFile, newContent.join('\n'));
  }
}

syncLocaleFiles();
