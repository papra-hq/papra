import { describe, expect, test } from 'vitest';
import {
  buildDoclingRequestBody,
  stripDoclingImagePlaceholders,
} from './docling.content-extraction-strategy.models';

describe('docling.content-extraction-strategy.models', () => {
  describe('buildDoclingRequestBody', () => {
    const file = new File(['document content'], 'document.txt', { type: 'text/plain' });

    test('the document is uploaded with Markdown and image placeholder output', async () => {
      const body = buildDoclingRequestBody({ file, options: {} });
      const uploadedFile = body.get('files') as File;

      expect(uploadedFile.name).toEqual('document.txt');
      expect(uploadedFile.type).toEqual('text/plain');
      expect(await uploadedFile.text()).toEqual('document content');
      expect([...body.keys()]).toEqual(['files', 'to_formats', 'image_export_mode']);
      expect(body.getAll('to_formats')).toEqual(['md']);
      expect(body.get('image_export_mode')).toEqual('placeholder');
    });

    test('multiple OCR languages and page numbers are sent as repeated fields', () => {
      const body = buildDoclingRequestBody({
        file,
        options: { ocr_lang: ['en', 'fr'], page_range: [1, 5] },
      });

      expect(body.getAll('ocr_lang')).toEqual(['en', 'fr']);
      expect(body.getAll('page_range')).toEqual(['1', '5']);
    });

    test('scalar options preserve punctuation, false, and zero values', () => {
      const body = buildDoclingRequestBody({
        file,
        options: {
          ocr_lang: 'en',
          force_ocr: true,
          do_table_structure: false,
          images_scale: 1.5,
          picture_description_area_threshold: 0,
          md_page_break_placeholder: 'Page break: next, please',
        },
      });

      expect(body.getAll('ocr_lang')).toEqual(['en']);
      expect(body.get('force_ocr')).toEqual('true');
      expect(body.get('do_table_structure')).toEqual('false');
      expect(body.get('images_scale')).toEqual('1.5');
      expect(body.get('picture_description_area_threshold')).toEqual('0');
      expect(body.get('md_page_break_placeholder')).toEqual('Page break: next, please');
    });

    test('nested options are JSON-encoded without flattening their values', () => {
      const body = buildDoclingRequestBody({
        file,
        options: {
          picture_description_api: {
            url: 'http://localhost:11434/v1/chat/completions',
            params: { model: 'granite3.2-vision:2b', stop: ['end', 'stop'], seed: null },
          },
        },
      });

      expect(body.get('picture_description_api')).toEqual(
        '{"url":"http://localhost:11434/v1/chat/completions","params":{"model":"granite3.2-vision:2b","stop":["end","stop"],"seed":null}}',
      );
    });

    test('null options and empty lists are omitted so Docling uses its defaults', () => {
      const body = buildDoclingRequestBody({
        file,
        options: { ocr_lang: [], document_timeout: null },
      });

      expect(body.has('ocr_lang')).toEqual(false);
      expect(body.has('document_timeout')).toEqual(false);
    });
  });

  describe('stripDoclingImagePlaceholders', () => {
    test('docling replaces graphical content with <!-- image -->, this function removes it', () => {
      expect(
        stripDoclingImagePlaceholders(
          'This is a test <!-- image --> with <!-- image -->some images.',
        ),
      ).to.eql('This is a test  with some images.');
    });

    test('it also trims the text', () => {
      expect(stripDoclingImagePlaceholders('   This is a test with some images.   ')).to.eql(
        'This is a test with some images.',
      );

      expect(
        stripDoclingImagePlaceholders('   This is a test with some images.   <!-- image -->'),
      ).to.eql('This is a test with some images.');
    });
  });
});
