import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createOrganizationsRepository } from './organizations.repository';
import { organizationInvitationsTable } from './organizations.table';

describe('organizations repository', () => {
  describe('updateExpiredPendingInvitationsStatus', () => {
    test('the pending invitations that are expired (expiredAt < now) are updated to expired', async () => {
      const commonInvitation = {
        organizationId: 'org_1',
        role: 'member',
        inviterId: 'user_1',
        createdAt: new Date('2025-05-05'),
        updatedAt: new Date('2025-05-05'),
      } as const;

      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user_1', email: 'user_1@test.com' }],
        organizations: [{ id: 'org_1', name: 'Test Organization' }],
        organizationInvitations: [
          {
            id: 'invitation_1',
            expiresAt: new Date('2025-05-12'),
            status: 'pending',
            email: 'test-1@test.com',
            ...commonInvitation,
          },
          {
            id: 'invitation_2',
            expiresAt: new Date('2025-05-14'),
            status: 'pending',
            email: 'test-2@test.com',
            ...commonInvitation,
          },
          {
            id: 'invitation_3',
            expiresAt: new Date('2025-05-05'),
            status: 'accepted',
            email: 'test-3@test.com',
            ...commonInvitation,
          },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });

      await organizationsRepository.updateExpiredPendingInvitationsStatus({ now: new Date('2025-05-13') });

      const invitations = await db.select().from(organizationInvitationsTable).orderBy(organizationInvitationsTable.id);

      expect(invitations).to.eql([
        {
          id: 'invitation_1',
          status: 'expired',
          expiresAt: new Date('2025-05-12'),
          email: 'test-1@test.com',
          ...commonInvitation,
        },
        {
          id: 'invitation_2',
          status: 'pending',
          expiresAt: new Date('2025-05-14'),
          email: 'test-2@test.com',
          ...commonInvitation,
        },
        {
          id: 'invitation_3',
          status: 'accepted',
          expiresAt: new Date('2025-05-05'),
          email: 'test-3@test.com',
          ...commonInvitation,
        },
      ]);
    });
  });
});
