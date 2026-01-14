import { describe, expect, test } from 'vitest';
import { formatFts5QueryValue } from './query-builder.models';

describe('query-builder models', () => {
  describe('formatFts5QueryValue', () => {
    test('for a standard query, the organization id is included for performance and matching is done on name and content columns by default', () => {
      expect(
        formatFts5QueryValue({
          value: 'foobar',
          organizationId: 'org_1',
        }),
      ).to.eql({
        queryString: 'organization_id:"org_1" {name content}:"foobar"*',
      });
    });

    test('the matching columns can be customized', () => {
      expect(
        formatFts5QueryValue({
          value: 'foobar',
          organizationId: 'org_1',
          matchingColumns: ['name'],
        }),
      ).to.eql({
        queryString: 'organization_id:"org_1" {name}:"foobar"*',
      });
    });

    test('if no matching columns are provided, all columns are searched', () => {
      expect(
        formatFts5QueryValue({
          value: 'foobar',
          organizationId: 'org_1',
          matchingColumns: [],
        }),
      ).to.eql({
        queryString: 'organization_id:"org_1" "foobar"*',
      });
    });
  });
});
