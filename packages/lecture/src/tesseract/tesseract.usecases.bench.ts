import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { bench, describe } from 'vitest';
import { createTesseractExtractor, isTesseractCliAvailable } from './tesseract.usecases';

const isEnabled = await isTesseractCliAvailable();

describe.runIf(isEnabled)('tesseract usecases benchmarks', () => {
  describe('basic png', async () => {
    const imageBuffer = await readFile(join(__dirname, '../../fixtures/006-png/006.input.png'));

    bench('pure js', async () => {
      const { extract } = await createTesseractExtractor({ languages: ['eng'], forceJs: true });
      await extract(imageBuffer);
    });

    bench('cli', async () => {
      const { extract } = await createTesseractExtractor({ languages: ['eng'], forceJs: false });
      await extract(imageBuffer);
    });
  });

  describe('big jpg', async () => {
    const imageBuffer = await readFile(join(__dirname, '../../fixtures/007-jpg/007.input.jpg'));

    bench('pure js', async () => {
      const { extract } = await createTesseractExtractor({ languages: ['eng'], forceJs: true });
      await extract(imageBuffer);
    });

    bench('cli', async () => {
      const { extract } = await createTesseractExtractor({ languages: ['eng'], forceJs: false });
      await extract(imageBuffer);
    });
  });
});
