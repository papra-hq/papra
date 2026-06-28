import { describe, expect, test } from 'vitest';
import { IN_BYTES } from '../../../../shared/units';
import { isMistralOcrAbleToExtractTextFromDocument } from './mistral-ocr.content-extraction-strategy.models';

describe('mistral-ocr.models', () => {
  describe('isMistralOcrAbleToExtractTextFromDocument', () => {
    test('mistral ocrs can extract text allowed mime types and files below 50MB', () => {
      expect(
        isMistralOcrAbleToExtractTextFromDocument({
          file: { type: 'application/pdf', size: 49 * IN_BYTES.MEGABYTE },
          mimeTypesAllowList: new Set(['application/pdf', 'image/*']),
        }),
      ).to.eql(true);

      expect(
        isMistralOcrAbleToExtractTextFromDocument({
          file: { type: 'application/pdf', size: 51 * IN_BYTES.MEGABYTE },
          mimeTypesAllowList: new Set(['application/pdf', 'image/*']),
        }),
      ).to.eql(false);

      expect(
        isMistralOcrAbleToExtractTextFromDocument({
          file: { type: 'image/png', size: 49 * IN_BYTES.MEGABYTE },
          mimeTypesAllowList: new Set(['application/pdf', 'image/*']),
        }),
      ).to.eql(true);

      expect(
        isMistralOcrAbleToExtractTextFromDocument({
          file: { type: 'image/png', size: 51 * IN_BYTES.MEGABYTE },
          mimeTypesAllowList: new Set(['application/pdf', 'image/*']),
        }),
      ).to.eql(false);

      expect(
        isMistralOcrAbleToExtractTextFromDocument({
          file: { type: 'image/jpeg', size: 49 * IN_BYTES.MEGABYTE },
          mimeTypesAllowList: new Set(['application/pdf', 'image/*']),
        }),
      ).to.eql(true);
    });
  });
});
