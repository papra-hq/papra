import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { tagColorSchema } from './tags.schemas';

describe('tags schemas', () => {
  describe('tagColorSchema', () => {
    test('the color of a tag is a 6 digits hex color code', () => {
      expect(() => v.parse(tagColorSchema, '#FFFFFF')).not.toThrow();
      expect(() => v.parse(tagColorSchema, '#000000')).not.toThrow();
      expect(() => v.parse(tagColorSchema, '#123ABC')).not.toThrow();
      expect(() => v.parse(tagColorSchema, '#abcdef')).not.toThrow();

      expect(() => v.parse(tagColorSchema, 'FFFFFF')).toThrow();
      expect(() => v.parse(tagColorSchema, '#FFF')).toThrow();
      expect(() => v.parse(tagColorSchema, '#123ABCG')).toThrow();
      expect(() => v.parse(tagColorSchema, '#123AB')).toThrow();
      expect(() => v.parse(tagColorSchema, 'blue')).toThrow();
    });

    test('the color of a tag is always uppercased', () => {
      expect(v.parse(tagColorSchema, '#abcdef')).toBe('#ABCDEF');
      expect(v.parse(tagColorSchema, '#abCdEf')).toBe('#ABCDEF');
      expect(v.parse(tagColorSchema, '#123abc')).toBe('#123ABC');
    });
  });
});
