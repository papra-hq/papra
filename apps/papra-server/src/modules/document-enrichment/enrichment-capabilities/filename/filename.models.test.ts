import { describe, expect, test } from 'vitest';
import { normalizeGeneratedFilename } from './filename.models';

describe('generated filenames', () => {
  test.each([
    ['2000-01-02_Example_Invoice.pdf.pdf', 'input.PDF', '2000-01-02_Example_Invoice.pdf'],
    ['../Example / Café: Test.pdf', 'old.pdf', 'Example_Café_Test.pdf'],
    ['Contract', 'old.DOCX', 'Contract.DOCX'],
    ['Invoice\u202Etxt.pdf', 'old.pdf', 'Invoice_txt.pdf'],
    ['Text\u200cwith\u200djoiners.pdf', 'old.pdf', 'Text\u200cwith\u200djoiners.pdf'],
    ['NUL.pdf', 'old.pdf', '_NUL.pdf'],
    ['', 'old.pdf', undefined],
    ['Letter', 'old.' + 'x'.repeat(240), undefined],
    ['..', 'old.pdf', undefined],
    ['a'.repeat(239) + '.truncated', 'input', 'a'.repeat(239)],
  ])('normalizes %s', (filename, originalName, expected) => {
    expect(normalizeGeneratedFilename({ filename, originalName })).toBe(expected);
  });
  test.each([
    0x80, 0x85, 0x9f, 0x061c, 0x200b, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e,
    0x2066, 0x2067, 0x2068, 0x2069,
  ])('replaces invisible control character U+%s', (codePoint) => {
    expect(
      normalizeGeneratedFilename({
        filename: `Invoice${String.fromCodePoint(codePoint)}txt.pdf`,
        originalName: 'old.pdf',
      }),
    ).toBe('Invoice_txt.pdf');
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
