import * as fs from 'node:fs';
import * as path from 'node:path';

const dirname = path.dirname(new URL(import.meta.url).pathname);

function getLineKey({ line }: { line: string }) {
  return line.split(': ')[0].trim();
}

function indexLinesByKeys(yaml: string) {
  const lines = yaml.split('\n');
  const indexedLines: Record<string, string> = {};

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      continue;
    }

    const key = getLineKey({ line });
    indexedLines[key] = trimmedLine;
  }

  return indexedLines;
}

function syncLocaleFiles() {
  const localesDir = path.join(dirname, '../locales');
  const enFile = path.join(localesDir, 'en.yml');
  const enContent = fs.readFileSync(enFile, 'utf8');
  const enLines = enContent.split('\n');

  const files = fs
    .readdirSync(localesDir)
    .filter(file => file.endsWith('.yml') && file !== 'en.yml');

  for (const file of files) {
    const targetFile = path.join(localesDir, file);
    console.log(`Syncing ${file} with en.yml`);

    const targetContent = fs.readFileSync(targetFile, 'utf8');
    const targetYaml = indexLinesByKeys(targetContent);

    const newContent = enLines
      .map((enLine) => {
        // Reflect empty lines from en.yml
        if (enLine.trim() === '') {
          return '';
        }

        // Reflect comments from en.yml
        if (enLine.trim().startsWith('#')) {
          return enLine;
        }

        const targetLine = targetYaml[getLineKey({ line: enLine })];

        // If a translation key exists in the target file, use it
        if (targetLine) {
          return targetLine;
        }

        // If the translation key does not exist in the target file, add a comment with the one from en.yml
        return `# ${enLine}`;
      })
      .join('\n');

    fs.writeFileSync(targetFile, newContent);
  }
}

syncLocaleFiles();
