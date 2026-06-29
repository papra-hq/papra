import { describe, expect, test } from 'vitest';
import { stripDoclingImagePlaceholders } from './docling.content-extraction-strategy.models';

describe('docling.content-extraction-strategy.models', () => {
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
