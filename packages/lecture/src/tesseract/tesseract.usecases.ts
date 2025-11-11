import type { Buffer } from 'node:buffer';
import { createWorker } from 'tesseract.js';
import { x as exec } from 'tinyexec';
import { castToBuffer } from '../utils/buffer';
import { memoize } from '../utils/memoize';

export async function isTesseractCliAvailable({ binary = 'tesseract' }: { binary?: string } = {}): Promise<boolean> {
  // eslint-disable-next-line node/prefer-global/process
  const isNode = typeof process !== 'undefined' && Boolean(process?.versions?.node);
  if (!isNode) {
    return false;
  }

  try {
    const result = await exec(binary, ['--version'], { throwOnError: true });

    return result.exitCode === 0;
  } catch {
    return false;
  }
}

export const isTesseractCliAvailableMemoized = memoize(isTesseractCliAvailable, ({ binary }) => binary);

export function createTesseractCliExtractor({ binary = 'tesseract', languages: factoryLanguages = ['eng'] }: { binary?: string; languages?: string[] } = {}) {
  return async (maybeArrayBuffer: ArrayBuffer | Buffer, { languages = factoryLanguages }: { languages?: string[] } = {}): Promise<string> => {
    try {
      const proc = exec(binary, ['stdin', 'stdout', '-l', languages.join('+')], { throwOnError: true });
      proc.process.stdin.end(castToBuffer(maybeArrayBuffer));

      const { stdout } = await proc;

      return stdout?.trim();
    } catch {
      return '';
    }
  };
}

export function createTesseractJsExtractor({ languages: factoryLanguages = ['eng'] }: { languages?: string[] } = {}) {
  return async (maybeArrayBuffer: ArrayBuffer | Buffer, { languages = factoryLanguages }: { languages?: string[] } = {}): Promise<string> => {
    try {
      const worker = await createWorker(languages);

      const { data: { text } } = await worker.recognize(castToBuffer(maybeArrayBuffer));
      await worker.terminate();

      return text?.trim();
    } catch {
      return '';
    }
  };
}

export async function createTesseractExtractor({
  forceJs = false,
  binary,
  languages,
}: { binary?: string; forceJs?: boolean; languages?: string[] } = {}) {
  const isCliAvailable = await isTesseractCliAvailableMemoized({ binary });

  if (isCliAvailable && !forceJs) {
    return {
      extract: createTesseractCliExtractor({ binary, languages }),
      extractorType: 'tesseract-cli' as const,
    };
  } else {
    return {
      extract: createTesseractJsExtractor({ languages }),
      extractorType: 'tesseract-js' as const,
    };
  }
}
