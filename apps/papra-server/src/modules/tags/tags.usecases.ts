import type { DocumentActivityRepository } from '../documents/document-activity/document-activity.repository';
import type { WebhookRepository } from '../webhooks/webhook.repository';
import type { TagsRepository } from './tags.repository';
import type { Tag } from './tags.types';
import { deferRegisterDocumentActivityLog } from '../documents/document-activity/document-activity.usecases';
import { deferTriggerWebhooks } from '../webhooks/webhook.usecases';

export async function addTagToDocument({
  tagId,
  documentId,
  organizationId,
  userId,
  tag,

  tagsRepository,
  webhookRepository,
  documentActivityRepository,
}: {
  tagId: string;
  documentId: string;
  organizationId: string;
  userId?: string;
  tag: Tag;

  tagsRepository: TagsRepository;
  webhookRepository: WebhookRepository;
  documentActivityRepository: DocumentActivityRepository;
}) {
  await tagsRepository.addTagToDocument({ tagId, documentId });

  deferTriggerWebhooks({
    webhookRepository,
    organizationId,
    event: 'document:tag:added',
    payload: { documentId, organizationId, tagId, tagName: tag.name },
  });

  deferRegisterDocumentActivityLog({
    documentId,
    event: 'tagged',
    userId,
    documentActivityRepository,
    tagId,
  });
}
