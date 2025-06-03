import { defineTask } from '../../tasks/tasks.models';
import { createOrganizationsRepository } from '../organizations.repository';

export const expireInvitationsTaskDefinition = defineTask({
  name: 'expire-invitations',
  isEnabled: ({ config }) => config.tasks.expireInvitations.enabled,
  cronSchedule: ({ config }) => config.tasks.expireInvitations.cron,
  runOnStartup: ({ config }) => config.tasks.expireInvitations.runOnStartup,
  handler: async ({ db, now }) => {
    const organizationsRepository = createOrganizationsRepository({ db });

    await organizationsRepository.updateExpiredPendingInvitationsStatus({ now });
  },
});
