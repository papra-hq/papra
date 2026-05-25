import { describe, expect, test } from 'vitest';
import { generatePropertyKey } from './custom-properties.repository.models';

describe('custom-properties repository models', () => {
  describe('generatePropertyKey', () => {
    test('a key is generated from the name', () => {
      expect(generatePropertyKey({ name: 'Invoice Number' })).toBe('invoicenumber');
    });

    test('diacritics are preserved', () => {
      expect(generatePropertyKey({ name: 'Catégorie du Document' })).toBe('catégoriedudocument');
      expect(generatePropertyKey({ name: 'Führerschein' })).toBe('führerschein');
    });

    test('cjk characters are preserved', () => {
      expect(generatePropertyKey({ name: '发票编号' })).toBe('发票编号');
      expect(generatePropertyKey({ name: '請求書番号' })).toBe('請求書番号');
      expect(generatePropertyKey({ name: '인보이스 번호' })).toBe('인보이스번호');
    });

    test('mixed scripts are preserved', () => {
      expect(generatePropertyKey({ name: 'Invoice 发票' })).toBe('invoice发票');
    });

    test('special characters are stripped', () => {
      expect(generatePropertyKey({ name: 'Invoice #123 (test)' })).toBe('invoice123test');
    });

    test('uppercase letters are converted to lowercase', () => {
      expect(generatePropertyKey({ name: 'InvoiceNumber' })).toBe('invoicenumber');
    });

    test('whitespace is stripped', () => {
      expect(generatePropertyKey({ name: '  Hello World  ' })).toBe('helloworld');
      expect(generatePropertyKey({ name: 'Hello  \t\nWorld' })).toBe('helloworld');
    });
  });
});
