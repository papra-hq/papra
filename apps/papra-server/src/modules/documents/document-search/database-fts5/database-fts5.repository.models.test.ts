import { describe, expect, test } from 'vitest';
import { createFts5DocumentSearchQuery, formatFts5SearchQuery } from './database-fts5.repository.models';

describe('database-fts5 repository models', () => {
  describe('formatFts5SearchQuery', () => {
    test('wraps single word with quotes and appends wildcard', () => {
      expect(
        formatFts5SearchQuery({ searchQuery: 'documents' }),
      ).to.eql({
        formattedSearchQuery: '"documents"*',
      });

      expect(
        formatFts5SearchQuery({ searchQuery: 'hello world' }),
      ).to.eql({
        formattedSearchQuery: '"hello"* "world"*',
      });
    });

    test('whitespaces are trimmed and reduced to single spaces', () => {
      expect(
        formatFts5SearchQuery({ searchQuery: '   multiple    spaces   here   ' }),
      ).to.eql({
        formattedSearchQuery: '"multiple"* "spaces"* "here"*',
      });
    });

    test('special characters are removed except hyphens and underscores', () => {
      expect(
        formatFts5SearchQuery({ searchQuery: 'special! @#characters$ %^&*()here' }),
      ).to.eql({
        formattedSearchQuery: '"special"* "characters"* "here"*',
      });

      expect(
        formatFts5SearchQuery({ searchQuery: '"hello world"' }),
      ).to.eql({
        formattedSearchQuery: '"hello"* "world"*',
      });

      expect(
        formatFts5SearchQuery({ searchQuery: 'hyphen-word_and_underscore' }),
      ).to.eql({
        formattedSearchQuery: '"hyphen-word_and_underscore"*',
      });
    });

    test('boolean operators are removed', () => {
      expect(
        formatFts5SearchQuery({ searchQuery: 'apple AND orange OR banana NOT grape' }),
      ).to.eql({
        formattedSearchQuery: '"apple"* "orange"* "banana"* "grape"*',
      });

      expect(
        formatFts5SearchQuery({ searchQuery: 'apple or orange' }),
      ).to.eql({
        formattedSearchQuery: '"apple"* "orange"*',
      });
    });

    test('empty or whitespace-only queries return empty formatted query', () => {
      expect(
        formatFts5SearchQuery({ searchQuery: '     ' }),
      ).to.eql({
        formattedSearchQuery: '',
      });

      expect(
        formatFts5SearchQuery({ searchQuery: '' }),
      ).to.eql({
        formattedSearchQuery: '',
      });
    });

    test('special language characters are preserved', () => {
      expect(
        formatFts5SearchQuery({ searchQuery: 'café naïve jalapeño façade' }),
      ).to.eql({
        formattedSearchQuery: '"café"* "naïve"* "jalapeño"* "façade"*',
      });

      expect(
        formatFts5SearchQuery({ searchQuery: 'добрый день привет' }),
      ).to.eql({
        formattedSearchQuery: '"добрый"* "день"* "привет"*',
      });

      expect(
        formatFts5SearchQuery({ searchQuery: 'こんにちは 世界' }),
      ).to.eql({
        formattedSearchQuery: '"こんにちは"* "世界"*',
      });
    });
  });

  describe('createFts5DocumentSearchQuery', () => {
    test('combines organization filter with formatted search query', () => {
      const { query } = createFts5DocumentSearchQuery({
        searchQuery: 'test search',
        organizationId: 'org123',
      });

      expect(query).toBe('organization_id:"org123" "test"* "search"*');
    });
  });
});
