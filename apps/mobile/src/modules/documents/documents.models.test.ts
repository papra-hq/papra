import { describe, expect, test } from 'vitest';
import { createDateFormatter } from '../i18n/formatters.models';
import { formatCustomPropertyValue } from './documents.models';

describe('formatCustomPropertyValue', () => {
  test.each([
    {
      type: 'select',
      value: { optionId: 'cpso_1', name: 'Invoice' },
      expected: 'Invoice',
    },
    {
      type: 'multi_select',
      value: [
        { optionId: 'cpso_1', name: 'Invoice' },
        { optionId: 'cpso_2', name: 'Paid' },
      ],
      expected: 'Invoice, Paid',
    },
    {
      type: 'multi_select',
      value: [{ optionId: 'cpso_1', name: 'Invoice' }],
      expected: 'Invoice',
    },
    { type: 'select', value: null, expected: '—' },
    { type: 'select', value: undefined, expected: '—' },
    { type: 'select', value: {}, expected: '—' },
    { type: 'multi_select', value: [], expected: '—' },
    { type: 'multi_select', value: null, expected: '—' },
    { type: 'multi_select', value: [null, {}], expected: '—' },
    { type: 'text', value: 'Notes', expected: 'Notes' },
    { type: 'text', value: '', expected: '—' },
    { type: 'number', value: 0, expected: '0' },
    { type: 'boolean', value: true, expected: 'Yes' },
    { type: 'boolean', value: false, expected: 'No' },
    { type: 'date', value: '2025-01-15T12:00:00', expected: 'Jan 15, 2025' },
    { type: 'date', value: 'invalid', expected: 'invalid' },
  ])('formats $type value $value as $expected', ({ type, value, expected }) => {
    expect(
      formatCustomPropertyValue(
        {
          key: 'property',
          name: 'Property',
          type,
          displayOrder: 0,
          value,
        },
        { formatDate: createDateFormatter({ locale: 'en-US' }) },
      ),
    ).toBe(expected);
  });

  test.each([
    { locale: 'en-GB', expected: '15 Jan 2025' },
    { locale: 'fr-CA', expected: '15 janv. 2025' },
    { locale: 'it-IT', expected: '15 gen 2025' },
  ])('formats custom-property dates using $locale', ({ locale, expected }) => {
    expect(
      formatCustomPropertyValue(
        {
          key: 'date',
          name: 'Date',
          type: 'date',
          displayOrder: 0,
          value: '2025-01-15T12:00:00',
        },
        { formatDate: createDateFormatter({ locale }) },
      ),
    ).toBe(expected);
  });
});
