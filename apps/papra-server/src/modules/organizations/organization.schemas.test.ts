import { describe, expect, test } from 'vitest';
import { organizationIdSchema } from './organization.schemas';

describe('organization schemas', () => {
  describe('organizationIdSchema', () => {
    test('an organization id should be a 24 character random string prefixed with "org"', () => {
      expect(organizationIdSchema.safeParse('org_aaaaaaaaaaaaaaaaaaaaaaaa').success).to.eql(true);
      expect(organizationIdSchema.safeParse('org_0aaaaaaaaaaaaaaaaaaaaaa1').success).to.eql(true);
      expect(organizationIdSchema.safeParse('org_000000000000000000000000').success).to.eql(true);

      expect(organizationIdSchema.safeParse('org_aaaa').success).to.eql(false);
      expect(organizationIdSchema.safeParse('org').success).to.eql(false);
      expect(organizationIdSchema.safeParse('foo').success).to.eql(false);
    });
  });
});
