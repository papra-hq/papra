import { describe, expect, test } from 'vitest';
import { normalizeTagName } from './tags.repository.models';

describe('tags repository models', () => {
  describe('normalizeTagName', () => {
    test('for unique constraint, the tag name is normalized by lowercasing it, keeping spaces', () => {
      expect(normalizeTagName({ name: 'todo' })).to.eql('todo');
      expect(normalizeTagName({ name: 'ToDo' })).to.eql('todo');
      expect(normalizeTagName({ name: '  Important  ' })).to.eql('  important  ');
      expect(normalizeTagName({ name: ' Urgent ' })).to.eql(' urgent ');
    });

    test('special characters are preserved during normalization but case is lowered', () => {
      expect(normalizeTagName({ name: 'Naïve café' })).to.eql('naïve café');
      expect(normalizeTagName({ name: 'École' })).to.eql('école');
      expect(normalizeTagName({ name: 'Привет' })).to.eql('привет');
      expect(normalizeTagName({ name: 'こんにちは' })).to.eql('こんにちは');
    });
  });
});
