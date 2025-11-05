import type { DbInsertableDocumentActivity, DbSelectableDocumentActivity, DocumentActivity, InsertableDocumentActivity } from './document-activity.tables';
import { generateId } from '../../shared/random/ids';
import { isNil } from '../../shared/utils';

const documentActivityIdPrefix = 'doc_act';
const generateDocumentActivityId = () => generateId({ prefix: documentActivityIdPrefix });

export function dbToDocumentActivity(dbActivity?: DbSelectableDocumentActivity): DocumentActivity | undefined {
  if (!dbActivity) {
    return undefined;
  }

  return {
    id: dbActivity.id,
    documentId: dbActivity.document_id,
    event: dbActivity.event,
    eventData: isNil(dbActivity.event_data) ? null : JSON.parse(dbActivity.event_data) as Record<string, unknown>,
    userId: dbActivity.user_id,
    tagId: dbActivity.tag_id,
    createdAt: new Date(dbActivity.created_at),
  };
}

export function documentActivityToDb(
  activity: InsertableDocumentActivity,
  {
    now = new Date(),
    generateId = generateDocumentActivityId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableDocumentActivity {
  return {
    id: activity.id ?? generateId(),
    document_id: activity.documentId,
    event: activity.event,
    event_data: activity.eventData ? JSON.stringify(activity.eventData) : null,
    user_id: activity.userId,
    tag_id: activity.tagId,
    created_at: activity.createdAt?.getTime() ?? now.getTime(),
  };
}
