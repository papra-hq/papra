import { describe, expect, test } from 'vitest';
import { buildExtractTextWithDoclingServer } from './docling.content-extraction-strategy.usecases';

describe('extractTextWithDoclingServer', () => {
  test('configured options accompany the document upload and the response yields clean text', async () => {
    const file = new File(['scanned document'], 'scan.jpg', { type: 'image/jpeg' });
    const extractText = buildExtractTextWithDoclingServer({
      baseUrl: 'http://docling:5001/',
      apiKey: 'test-api-key',
      timeoutMs: 300000,
      options: { ocr_lang: ['en', 'fr'], force_ocr: true },
      request: async (url, { method, headers, timeout, body }) => {
        expect(url).toEqual('http://docling:5001/v1/convert/file');
        expect(method).toEqual('POST');
        expect(headers).toEqual({ 'X-Api-Key': 'test-api-key' });
        expect(timeout).toEqual(300000);

        // Round-trip the multipart body to verify the fields Docling receives.
        const form = await new Response(body as FormData).formData();
        const uploadedFile = form.get('files') as File;

        expect(uploadedFile.name).toEqual('scan.jpg');
        expect(uploadedFile.type).toEqual('image/jpeg');
        expect(await uploadedFile.text()).toEqual('scanned document');
        expect(form.getAll('ocr_lang')).toEqual(['en', 'fr']);
        expect(form.get('force_ocr')).toEqual('true');
        expect(form.get('to_formats')).toEqual('md');

        return {
          status: 'success',
          document: { md_content: ' <!-- image -->Extracted text ' },
        };
      },
    });

    expect(await extractText({ file })).toEqual({ text: 'Extracted text' });
  });
});
