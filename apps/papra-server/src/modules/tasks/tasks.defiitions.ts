import { hardDeleteExpiredDocumentsTaskDefinition } from '../documents/tasks/hard-delete-expired-documents.task';
import { expireInvitationsTaskDefinition } from '../organizations/tasks/expire-invitations.task';

export const taskDefinitions = [
  hardDeleteExpiredDocumentsTaskDefinition,
  expireInvitationsTaskDefinition,
];
