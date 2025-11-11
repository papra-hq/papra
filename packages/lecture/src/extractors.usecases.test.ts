import fs from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mime from 'mime';
import { glob } from 'tinyglobby';
import { describe, expect, test } from 'vitest';
import { extractText, extractTextFromBlob, extractTextFromFile } from './extractors.usecases';

const currentFile = fileURLToPath(import.meta.url);
const packageRoot = join(dirname(currentFile), '..');

const fixturesDir = await glob(['fixtures/*', '!fixtures/_*'], { onlyDirectories: true, cwd: packageRoot, absolute: true });

describe('extractors usecases', () => {
  describe('extractText', () => {
    test('when no extractor is found for the mimeType, the textContent is undefined', async () => {
      const { textContent, error, extractorName } = await extractText({
        arrayBuffer: new ArrayBuffer(0),
        mimeType: 'application/unknown',
      });

      expect(error).to.eql(undefined);
      expect(extractorName).to.eql(undefined);
      expect(textContent).to.eql(undefined);
    });

    test('when an error occurs during extraction, the error is returned along with the extractor name and undefined textContent', async () => {
      const { textContent, error, extractorName } = await extractText({
        arrayBuffer: new ArrayBuffer(0), // empty array buffer will cause an error in the pdf extractor
        mimeType: 'application/pdf',
      });

      expect(error).to.not.eql(undefined);
      expect(error).to.be.instanceOf(Error);
      expect(extractorName).to.eql('pdf');
      expect(textContent).to.eql(undefined);
    });

    describe('text is extracted from fixtures files', async () => {
      test('at least one fixture file is present', () => {
        expect(fixturesDir.length).to.be.greaterThan(0);
      });

      for (const fixtureDir of fixturesDir) {
        const fixtureName = fixtureDir.split('/').filter(Boolean).pop();

        // use test.concurrent to run the tests in parallel -> need to use the provided expect
        test(`fixture ${fixtureName}`, { timeout: 20_000, concurrent: true }, async ({ expect }) => {
          const fixtureFilesPaths = await glob(['*'], { cwd: fixtureDir, absolute: true });

          const inputFilePath = fixtureFilesPaths.find(name => name.match(/\/\d{3}\.input\.\w+$/));
          const configFilePath = fixtureFilesPaths.find(name => name.match(/\/\d{3}\.config\.ts$/));

          const config = configFilePath ? (await import(configFilePath)).config : undefined;

          const arrayBuffer = (await fs.readFile(inputFilePath)).buffer as ArrayBuffer;
          const mimeType = mime.getType(inputFilePath);

          const { textContent, error, extractorName, extractorType } = await extractText({
            arrayBuffer,
            mimeType,
            config: {
              ...config,
              tesseract: {
                forceJs: true,
                ...config?.tesseract,
              },
            },
          });

          expect(error).to.eql(undefined);
          expect(extractorName).to.not.eql(undefined);
          expect(extractorType).to.not.eql(undefined);

          const fixtureNumber = fixtureDir.split('/').filter(Boolean).pop().slice(0, 3);
          const expectedFilePath = join(fixtureDir, `${fixtureNumber}.expected.txt`);

          await expect(textContent).toMatchFileSnapshot(expectedFilePath, 'Fixture does not match snapshot');
        });
      }
    });
  });

  describe('extractTextFromBlob', () => {
    test('extracts text from a blob instance', async () => {
      const blob = new Blob(['Hello, world!'], { type: 'text/plain' });

      const { textContent, error, extractorName } = await extractTextFromBlob({ blob });

      expect(error).to.eql(undefined);
      expect(extractorName).to.eql('text');
      expect(textContent).to.eql('Hello, world!');
    });
  });

  describe('extractTextFromFile', () => {
    test('extracts text from a file instance', async () => {
      const file = new File(['Hello, world!'], 'hello.txt', { type: 'text/plain' });

      const { textContent, error, extractorName } = await extractTextFromFile({ file });

      expect(error).to.eql(undefined);
      expect(extractorName).to.eql('text');
      expect(textContent).to.eql('Hello, world!');
    });
  });
});
