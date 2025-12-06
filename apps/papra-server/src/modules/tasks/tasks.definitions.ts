import type { GlobalDependencies } from '../app/server.types';
import { registerExtractDocumentFileContentTask } from '../documents/tasks/extract-document-file-content.task';
import { registerHardDeleteExpiredDocumentsTask } from '../documents/tasks/hard-delete-expired-documents.task';
import { registerExpireInvitationsTask } from '../organizations/tasks/expire-invitations.task';
import { registerPurgeExpiredOrganizationsTask } from '../organizations/tasks/purge-expired-organizations.task';
import { registerApplyTaggingRuleToDocumentsTask } from '../tagging-rules/tasks/apply-tagging-rule-to-documents.task';

export async function registerTaskDefinitions(deps: GlobalDependencies) {
  await registerHardDeleteExpiredDocumentsTask(deps);
  await registerExpireInvitationsTask(deps);
  await registerPurgeExpiredOrganizationsTask(deps);
  await registerExtractDocumentFileContentTask(deps);
  await registerApplyTaggingRuleToDocumentsTask(deps);
}
