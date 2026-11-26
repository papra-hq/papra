import { describe, expect, test } from 'vitest';
import { doclingOptionsSchema } from './docling.content-extraction-strategy.schemas';
import * as v from 'valibot';

describe('docling.content-extraction-strategy.schemas', () => {
  describe('doclingOptionsSchema', () => {
    test('DOCLING_OPTIONS accepts a JSON object with Docling conversion options', () => {
      const options = {
        ocr_lang: ['en', 'fr'],
        force_ocr: true,
        images_scale: 2,
        table_mode: 'accurate',
        ocr_custom_config: { kind: 'rapidocr' },
        document_timeout: null,
        future_option: 'custom value',
      };

      const parsedOptions = v.parse(doclingOptionsSchema, JSON.stringify(options));

      expect(parsedOptions).toEqual(options);
    });

    test('malformed JSON and comma-separated options are rejected', () => {
      expect(() => v.parse(doclingOptionsSchema, '{"ocr_lang":')).toThrow();
      expect(() => v.parse(doclingOptionsSchema, 'ocr_lang:en,force_ocr:true')).toThrow();
    });

    test('empty string is treated as an empty object', () => {
      expect(v.parse(doclingOptionsSchema, '')).toEqual({});
    });

    test('the JSON value must be an object', () => {
      for (const input of ['[]', 'null', 'true', '42', '"en"']) {
        expect(() => v.parse(doclingOptionsSchema, input)).toThrow();
      }
    });

    test('fields controlling the uploaded file and response format are rejected', () => {
      for (const key of ['files', 'to_formats', 'image_export_mode', 'target']) {
        expect(() => v.parse(doclingOptionsSchema, JSON.stringify({ [key]: 'override' }))).toThrow(
          'DOCLING_OPTIONS cannot set files, to_formats, image_export_mode, or target; these fields are managed by Papra.',
        );
      }
    });
  });
});
