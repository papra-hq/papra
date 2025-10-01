import { describe, expect, test } from 'vitest';
import { tagColorSchema } from './tags.schemas';

describe('tags schemas', () => {
  describe('tagColorSchema', () => {
    test('the color of a tag is a 6 digits hex color code', () => {
      expect(() => tagColorSchema.parse('#FFFFFF')).not.toThrow();
      expect(() => tagColorSchema.parse('#000000')).not.toThrow();
      expect(() => tagColorSchema.parse('#123ABC')).not.toThrow();
      expect(() => tagColorSchema.parse('#abcdef')).not.toThrow();

      expect(() => tagColorSchema.parse('FFFFFF')).toThrow();
      expect(() => tagColorSchema.parse('#FFF')).toThrow();
      expect(() => tagColorSchema.parse('#123ABCG')).toThrow();
      expect(() => tagColorSchema.parse('#123AB')).toThrow();
      expect(() => tagColorSchema.parse('blue')).toThrow();
    });

    test('the color of a tag is always uppercased', () => {
      expect(tagColorSchema.parse('#abcdef')).toBe('#ABCDEF');
      expect(tagColorSchema.parse('#abCdEf')).toBe('#ABCDEF');
      expect(tagColorSchema.parse('#123abc')).toBe('#123ABC');
    });
  });
});
