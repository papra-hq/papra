import type { Database } from '../app/database/database.types';
import type { Config } from '../config/config.types';
import type { TaskServices } from './tasks.services';
import { registerExtractDocumentFileContentTask } from '../documents/tasks/extract-document-file-content.task';
import { registerHardDeleteExpiredDocumentsTask } from '../documents/tasks/hard-delete-expired-documents.task';
import { registerExpireInvitationsTask } from '../organizations/tasks/expire-invitations.task';

export async function registerTaskDefinitions({ taskServices, db, config }: { taskServices: TaskServices; db: Database; config: Config }) {
  await registerHardDeleteExpiredDocumentsTask({ taskServices, db, config });
  await registerExpireInvitationsTask({ taskServices, db, config });
  await registerExtractDocumentFileContentTask({ taskServices, db, config });
}
