import { describe, expect, test } from 'vitest';
import { normalizeGeneratedFilename } from './filename.models';

describe('generated filenames', () => {
  test.each([
    ['2000-01-02_Example_Invoice.pdf.pdf', 'input.PDF', '2000-01-02_Example_Invoice.pdf'],
    ['../Example / Café: Test.pdf', 'old.pdf', 'Example_Café_Test.pdf'],
    ['Contract', 'old.DOCX', 'Contract.DOCX'],
    ['NUL.pdf', 'old.pdf', '_NUL.pdf'],
    ['', 'old.pdf', undefined],
    ['Letter', 'old.' + 'x'.repeat(240), undefined],
    ['..', 'old.pdf', undefined],
    ['a'.repeat(239) + '.truncated', 'input', 'a'.repeat(239)],
  ])('normalizes %s', (filename, originalName, expected) => {
    expect(normalizeGeneratedFilename({ filename, originalName })).toBe(expected);
  });
  test('bounds UTF-8 filename length without breaking umlauts', () => {
    const result = normalizeGeneratedFilename({
      filename: 'ü'.repeat(200),
      originalName: 'x.pdf',
    })!;
    expect(Buffer.byteLength(result)).toBeLessThanOrEqual(240);
    expect(result).toMatch(/^ü+\.pdf$/);
  });
});
