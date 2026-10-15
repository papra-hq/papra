import { describe, expect, test } from 'vitest';
import { getDocumentDateAction } from './auto-document-date.models';

const now = new Date('2026-10-12T00:00:00.000Z');

describe('auto-document-date.models', () => {
  describe('getDocumentDateAction', () => {
    test('a valid ISO date is converted to a date at noon UTC', () => {
      expect(
        getDocumentDateAction({ autoDocumentDateResponse: { documentDate: '2026-03-14' }, now }),
      ).to.eql({ documentDate: new Date('2026-03-14T12:00:00.000Z') });
    });

    test('surrounding whitespace is ignored', () => {
      expect(
        getDocumentDateAction({ autoDocumentDateResponse: { documentDate: ' 2026-03-14 ' }, now }),
      ).to.eql({ documentDate: new Date('2026-03-14T12:00:00.000Z') });
    });

    test('no date is set when the AI returns null, nothing, or a non-string value', () => {
      expect(
        getDocumentDateAction({ autoDocumentDateResponse: { documentDate: null }, now }),
      ).to.eql({ documentDate: undefined });
      expect(getDocumentDateAction({ autoDocumentDateResponse: {}, now })).to.eql({
        documentDate: undefined,
      });
      expect(
        getDocumentDateAction({
          autoDocumentDateResponse: { documentDate: 20260314 as unknown as string },
          now,
        }),
      ).to.eql({ documentDate: undefined });
    });

    test('dates in other formats are rejected', () => {
      for (const documentDate of [
        '14/03/2026',
        'March 14, 2026',
        '2026-3-14',
        '2026-03-14T10:00:00Z',
      ]) {
        expect(getDocumentDateAction({ autoDocumentDateResponse: { documentDate }, now })).to.eql({
          documentDate: undefined,
        });
      }
    });

    test('dates that do not exist in the calendar are rejected', () => {
      for (const documentDate of ['2026-02-30', '2026-13-01', '2026-00-10', '2025-02-29']) {
        expect(getDocumentDateAction({ autoDocumentDateResponse: { documentDate }, now })).to.eql({
          documentDate: undefined,
        });
      }

      expect(
        getDocumentDateAction({ autoDocumentDateResponse: { documentDate: '2024-02-29' }, now }),
      ).to.eql({ documentDate: new Date('2024-02-29T12:00:00.000Z') });
    });

    test('implausible years are rejected', () => {
      expect(
        getDocumentDateAction({ autoDocumentDateResponse: { documentDate: '1899-12-31' }, now }),
      ).to.eql({ documentDate: undefined });
      expect(
        getDocumentDateAction({ autoDocumentDateResponse: { documentDate: '2028-01-01' }, now }),
      ).to.eql({ documentDate: undefined });
      expect(
        getDocumentDateAction({ autoDocumentDateResponse: { documentDate: '2027-12-31' }, now }),
      ).to.eql({ documentDate: new Date('2027-12-31T12:00:00.000Z') });
    });
  });
});
