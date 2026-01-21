import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { extractText } from '@papra/lecture';

// Configuration
const DELETE_AFTER_PROCESSING = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCUMENTS_DIR = path.join(__dirname, '../modules/demo/seed/documents');
const GENERATE_DIR = path.join(DOCUMENTS_DIR, 'generate');

type FileMetadata = {
  filename: string;
  path: string;
  size: number;
  extension: string;
  mimeType: string;
};

function getNextFixtureNumber(): string {
  const files = fs.readdirSync(DOCUMENTS_DIR);
  const fixtureFiles = files.filter(file => /^\d{3}\.demo-document\.ts$/.test(file));

  if (fixtureFiles.length === 0) {
    return '001';
  }

  const numbers = fixtureFiles.map(file => Number.parseInt(file.substring(0, 3), 10));
  const maxNumber = Math.max(...numbers);
  const nextNumber = maxNumber + 1;

  return nextNumber.toString().padStart(3, '0');
}

function getMimeType({ filename }: { filename: string }): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.rtf': 'application/rtf',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.odp': 'application/vnd.oasis.opendocument.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.webp': 'image/webp',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

function getFilesToProcess(): FileMetadata[] {
  const files = fs.readdirSync(GENERATE_DIR);

  return files
    .filter(filename => filename !== '.gitkeep')
    .map((filename) => {
      const filePath = path.join(GENERATE_DIR, filename);
      const stats = fs.statSync(filePath);
      const extension = path.extname(filename);
      const mimeType = getMimeType({ filename });

      return {
        filename,
        path: filePath,
        size: stats.size,
        extension,
        mimeType,
      };
    });
}

async function extractTextFromFile({ filePath, mimeType }: { filePath: string; mimeType: string }): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  );

  const result = await extractText({
    arrayBuffer,
    mimeType,
  });

  if (result.error) {
    throw result.error;
  }

  // Remove duplicated words, lines breaks, punctuations, and extra spaces
  const simplifiedContentWords = [...new Set(
    result.textContent
      ?.replace(/[\r\n]+/g, ' ') // Normalize line breaks
      .replace(/[^\w\s]|_/g, ' ') // Remove punctuations
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim()
      .toLowerCase()
      .split(' '),
  )];

  // multi-lined content
  const wordPerLine = 10;
  let simplifiedContent = '';
  for (let i = 0; i < simplifiedContentWords.length; i += wordPerLine) {
    const lineWords = simplifiedContentWords.slice(i, i + wordPerLine);
    simplifiedContent += `${lineWords.join(' ')}\n`;
  }

  return simplifiedContent;
}

function generateFixtureFile({ fixtureNumber, metadata, content }: { fixtureNumber: string; metadata: FileMetadata; content: string }): string {
  const nameWithoutExt = path.basename(metadata.filename, metadata.extension);

  return `import type { DemoDocumentFixture } from '../fixtures.types';
import fileUrl from './${fixtureNumber}.demo-document.file${metadata.extension}?url';

const demoDocumentFixture: DemoDocumentFixture = {
  name: '${nameWithoutExt}',
  fileUrl,
  date: new Date('${new Date().toISOString().split('T')[0]}'),
  mimeType: '${metadata.mimeType}',
  size: ${metadata.size},
  tags: [],
  content: \`
${content}
\`.trim(),
};

export default demoDocumentFixture;
`;
}

async function processFile({ file, fixtureNumber }: { file: FileMetadata; fixtureNumber: string }): Promise<void> {
  console.log(`\nProcessing: ${file.filename}`);

  const content = await extractTextFromFile({ filePath: file.path, mimeType: file.mimeType });

  const fileDestPath = path.join(DOCUMENTS_DIR, `${fixtureNumber}.demo-document.file${file.extension}`);
  fs.copyFileSync(file.path, fileDestPath);

  const fixtureContent = generateFixtureFile({ fixtureNumber, metadata: file, content });
  const fixtureDestPath = path.join(DOCUMENTS_DIR, `${fixtureNumber}.demo-document.ts`);
  fs.writeFileSync(fixtureDestPath, fixtureContent, 'utf-8');
  console.log(`Generated fixture: ${fixtureDestPath}`);

  // Delete source file if configured
  if (DELETE_AFTER_PROCESSING) {
    fs.unlinkSync(file.path);
    console.log(`Deleted source file: ${file.path}`);
  }
}

async function main() {
  console.log(`Generate directory: ${GENERATE_DIR}`);
  console.log(`Output directory: ${DOCUMENTS_DIR}`);
  console.log(`Delete after processing: ${DELETE_AFTER_PROCESSING}\n`);

  // Get files to process
  const files = getFilesToProcess();

  if (files.length === 0) {
    console.log('No files to process.');
    return;
  }

  console.log(`Found ${files.length} file(s) to process:\n`);
  files.forEach(file => console.log(`  - ${file.filename}`));

  // Process each file
  let currentFixtureNumber = Number.parseInt(getNextFixtureNumber(), 10);

  for (const file of files) {
    try {
      const fixtureNumber = currentFixtureNumber.toString().padStart(3, '0');
      await processFile({ file, fixtureNumber });
      currentFixtureNumber++;
    } catch (error) {
      console.error(`\nError processing ${file.filename}:`, error);
    }
  }
}

// Execute
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
