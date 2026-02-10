import { describe, expect, test } from 'vitest';
import { buildLocalStorageKey, joinLocalStorageKey } from './persistence.models';

describe('local-storage models', () => {
  describe('joinLocalStorageKey', () => {
    test('simply joins the provided parts with a ":" separator', () => {
      expect(joinLocalStorageKey('papra', 'test')).toBe('papra:test');
      expect(joinLocalStorageKey('part1', 'part2', 'part3')).toBe('part1:part2:part3');
    });
  });

  describe('buildLocalStorageKey', () => {
    test('adds the "papra" prefix to the provided parts and joins them with a ":" separator', () => {
      expect(buildLocalStorageKey('test')).toBe('papra:test');
      expect(buildLocalStorageKey('part1', 'part2', 'part3')).toBe('papra:part1:part2:part3');
    });
  });
});
