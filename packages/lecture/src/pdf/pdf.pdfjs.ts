import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { definePDFJSModule } from 'unpdf';

// unpdf's bundled pdf.js ships without the JBIG2/CCITT wasm decoders, so
// scanned PDFs render as blank pages (or OCR yields no text) unless the full
// pdfjs-dist build is injected.
//
// pdf.js loads those wasm decoders through fetch(), which cannot read the
// file:// URLs available in Node (its NodeBinaryDataFactory even references
// the browser `document` global), so every JBIG2/CCITT image would log a
// warning and fall back to the much slower pure-JS decoder.
// FsBinaryDataFactory reads the data from the filesystem instead;
// `useWorkerFetch: false` makes pdf.js request it through that factory.

// Replacement for pdf.js's NodeBinaryDataFactory, whose fetch-based loading
// cannot handle the file:// URLs used here.
export class FsBinaryDataFactory {
  cMapUrl: string | null;
  standardFontDataUrl: string | null;
  wasmUrl: string | null;

  constructor({
    cMapUrl = null,
    standardFontDataUrl = null,
    wasmUrl = null,
  }: {
    cMapUrl?: string | null;
    standardFontDataUrl?: string | null;
    wasmUrl?: string | null;
  } = {}) {
    this.cMapUrl = cMapUrl;
    this.standardFontDataUrl = standardFontDataUrl;
    this.wasmUrl = wasmUrl;
  }

  async fetch({ kind, filename }: { kind: string; filename: string }): Promise<Uint8Array> {
    const baseUrl =
      kind === 'cMapUrl'
        ? this.cMapUrl
        : kind === 'standardFontDataUrl'
          ? this.standardFontDataUrl
          : this.wasmUrl;
    if (!baseUrl) {
      throw new Error(`Ensure that the \`${kind}\` API parameter is provided.`);
    }

    const url = `${baseUrl}${filename}`;
    if (url.startsWith('file://')) {
      return new Uint8Array(await readFile(fileURLToPath(url)));
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return new Uint8Array(await response.arrayBuffer());
  }
}

/**
 * Injects the full pdfjs-dist build (legacy Node.js build, which ships the
 * JBIG2/CCITT wasm decoders) into unpdf, and returns the options to pass to
 * `getDocumentProxy` so the wasm is loaded from the filesystem.
 *
 * Safe to call in every context that opens a PDF (main thread, worker
 * threads, library consumers): each context resolves its own pdfjs-dist and
 * unpdf instances, and calling it multiple times is idempotent.
 */
export async function configureNodePdfjs() {
  // eslint-disable-next-line promise-function-async -- top-level await in ESM is valid
  await definePDFJSModule(() => import('pdfjs-dist/legacy/build/pdf.mjs'));

  const require = createRequire(import.meta.url);
  const wasmUrl =
    pathToFileURL(require.resolve('pdfjs-dist/wasm/jbig2.wasm')).href.replace('/jbig2.wasm', '') +
    '/';

  return {
    wasmUrl,
    useWorkerFetch: false,
    BinaryDataFactory: FsBinaryDataFactory,
  };
}
