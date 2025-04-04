import { omit } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createIntakeEmailsRepository } from './intake-emails.repository';

describe('intake-emails repository', () => {
  describe('crud operations on intake-emails', () => {
    test('an intake-email can be created, retrieved, and updated', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
      });

      const intakeEmailsRepository = createIntakeEmailsRepository({ db });

      const { intakeEmail } = await intakeEmailsRepository.createIntakeEmail({
        organizationId: 'organization-1',
        emailAddress: 'foo@example.fr',
      });

      expect(
        omit(intakeEmail, ['id', 'createdAt', 'updatedAt']),
      ).to.eql({
        organizationId: 'organization-1',
        isEnabled: true,
        allowedOrigins: [],
        emailAddress: 'foo@example.fr',
      });

      const { intakeEmail: updatedIntakeEmail } = await intakeEmailsRepository.updateIntakeEmail({
        intakeEmailId: intakeEmail.id,
        organizationId: 'organization-1',
        isEnabled: false,
        allowedOrigins: ['foo@example.fr'],
      });

      expect(
        omit(updatedIntakeEmail, ['id', 'createdAt', 'updatedAt']),
      ).to.eql({
        organizationId: 'organization-1',
        isEnabled: false,
        allowedOrigins: ['foo@example.fr'],
        emailAddress: 'foo@example.fr',
      });

      const { intakeEmail: retrievedIntakeEmail } = await intakeEmailsRepository.getIntakeEmail({
        intakeEmailId: intakeEmail.id,
        organizationId: 'organization-1',
      });

      expect(
        omit(retrievedIntakeEmail, ['id', 'createdAt', 'updatedAt']),
      ).to.eql({
        organizationId: 'organization-1',
        isEnabled: false,
        allowedOrigins: ['foo@example.fr'],
        emailAddress: 'foo@example.fr',
      });

      const { intakeEmails: orgIntakeEmails } = await intakeEmailsRepository.getOrganizationIntakeEmails({
        organizationId: 'organization-1',
      });

      expect(orgIntakeEmails).to.eql([retrievedIntakeEmail]);

      await intakeEmailsRepository.deleteIntakeEmail({ intakeEmailId: intakeEmail.id, organizationId: 'organization-1' });

      const { intakeEmails: orgIntakeEmailsAfterDelete } = await intakeEmailsRepository.getOrganizationIntakeEmails({
        organizationId: 'organization-1',
      });

      expect(orgIntakeEmailsAfterDelete).to.eql([]);
    });
  });
});
