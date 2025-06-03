import type { OrganizationInvitation } from './organizations.types';
import { describe, expect, test } from 'vitest';
import { ORGANIZATION_INVITATION_STATUS } from './organizations.constants';
import { ensureInvitationStatus } from './organizations.repository.models';

describe('organizations repository models', () => {
  describe('ensureInvitationStatus', () => {
    test('when retrieving a pending invitation from the db, it may be just expired', () => {
      expect(
        ensureInvitationStatus({
          invitation: {
            id: '1',
            status: ORGANIZATION_INVITATION_STATUS.PENDING,
            expiresAt: new Date('2025-05-12'),
          } as OrganizationInvitation,
          now: new Date('2025-05-13'),
        }),
      ).to.eql({
        id: '1',
        status: ORGANIZATION_INVITATION_STATUS.EXPIRED,
        expiresAt: new Date('2025-05-12'),
      });

      // non expired invitation
      expect(
        ensureInvitationStatus({
          invitation: {
            id: '1',
            status: ORGANIZATION_INVITATION_STATUS.PENDING,
            expiresAt: new Date('2025-05-14'),
          } as OrganizationInvitation,
          now: new Date('2025-05-13'),
        }),
      ).to.eql({
        id: '1',
        status: ORGANIZATION_INVITATION_STATUS.PENDING,
        expiresAt: new Date('2025-05-14'),
      });

      // Non pending invitation
      expect(
        ensureInvitationStatus({
          invitation: {
            id: '1',
            status: ORGANIZATION_INVITATION_STATUS.EXPIRED,
            expiresAt: new Date('2025-05-12'),
          } as OrganizationInvitation,
          now: new Date('2025-05-13'),
        }),
      ).to.eql({
        id: '1',
        status: ORGANIZATION_INVITATION_STATUS.EXPIRED,
        expiresAt: new Date('2025-05-12'),
      });

      expect(
        ensureInvitationStatus({
          invitation: {
            id: '1',
            status: ORGANIZATION_INVITATION_STATUS.CANCELLED,
            expiresAt: new Date('2025-05-12'),
          } as OrganizationInvitation,
          now: new Date('2025-05-13'),
        }),
      ).to.eql({
        id: '1',
        status: ORGANIZATION_INVITATION_STATUS.CANCELLED,
        expiresAt: new Date('2025-05-12'),
      });
    });

    test('nullish invitation stay nullish', () => {
      expect(
        ensureInvitationStatus({
          invitation: null,
        }),
      ).to.eql(null);
    });
  });
});
