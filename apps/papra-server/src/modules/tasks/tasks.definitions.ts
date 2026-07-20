import { registerAutoTagDocumentTask } from '../auto-tagging/tasks/auto-tag-document.task';
import type { GlobalDependencies } from '../app/server.types';
import { registerBackupSchedulerTickTask } from '../backups/tasks/backup-scheduler-tick.task';
import { registerBackupRetentionCleanupTask } from '../backups/tasks/backup-retention-cleanup.task';
import { registerExtractDocumentFileContentTask } from '../documents/tasks/extract-document-file-content.task';
import { registerHardDeleteExpiredDocumentsTask } from '../documents/tasks/hard-delete-expired-documents.task';
import { registerPurgeExpiredKvEntriesTask } from '../kv-store/tasks/purge-expired-kv-entries.task';
import { registerExpireInvitationsTask } from '../organizations/tasks/expire-invitations.task';
import { registerPurgeExpiredOrganizationsTask } from '../organizations/tasks/purge-expired-organizations.task';
import { registerApplyTaggingRuleToDocumentsTask } from '../tagging-rules/tasks/apply-tagging-rule-to-documents.task';

export async function registerTaskDefinitions(deps: GlobalDependencies) {
  await registerHardDeleteExpiredDocumentsTask(deps);
  await registerExpireInvitationsTask(deps);
  await registerPurgeExpiredOrganizationsTask(deps);
  await registerExtractDocumentFileContentTask(deps);
  await registerApplyTaggingRuleToDocumentsTask(deps);
  await registerPurgeExpiredKvEntriesTask(deps);
  await registerAutoTagDocumentTask(deps);
  await registerBackupSchedulerTickTask(deps);
  await registerBackupRetentionCleanupTask(deps);
}
