import type { Config } from '../config/config.types';
import type { DocumentActivityRepository } from '../documents/document-activity/document-activity.repository';
import type { WebhookTriggerServices } from '../webhooks/webhooks.trigger.services';
import type { TagsRepository } from './tags.repository';
import type { Tag } from './tags.types';
import { deferRegisterDocumentActivityLog } from '../documents/document-activity/document-activity.usecases';
import { createOrganizationTagLimitReachedError } from './tags.errors';

export async function checkIfOrganizationCanCreateNewTag({
  organizationId,
  config,
  tagsRepository,
}: {
  organizationId: string;
  config: Config;
  tagsRepository: TagsRepository;
}) {
  const { tagsCount } = await tagsRepository.getOrganizationTagsCount({ organizationId });

  if (tagsCount >= config.tags.maxTagsPerOrganization) {
    throw createOrganizationTagLimitReachedError();
  }
}

export async function createTag({
  organizationId,
  name,
  color,
  description,
  config,
  tagsRepository,
}: {
  organizationId: string;
  name: string;
  color: string;
  description?: string;
  config: Config;
  tagsRepository: TagsRepository;
}) {
  await checkIfOrganizationCanCreateNewTag({ organizationId, config, tagsRepository });

  const { tag } = await tagsRepository.createTag({ tag: { organizationId, name, color, description } });

  return { tag };
}

export async function addTagToDocument({
  tagId,
  documentId,
  organizationId,
  userId,
  tag,

  tagsRepository,
  webhookTriggerServices,
  documentActivityRepository,
}: {
  tagId: string;
  documentId: string;
  organizationId: string;
  userId?: string;
  tag: Tag;

  tagsRepository: TagsRepository;
  webhookTriggerServices: WebhookTriggerServices;
  documentActivityRepository: DocumentActivityRepository;
}) {
  await tagsRepository.addTagToDocument({ tagId, documentId });

  webhookTriggerServices.deferTriggerWebhooks({
    organizationId,
    event: 'document:tag:added',
    payloads: [{ documentId, organizationId, tagId, tagName: tag.name }],
  });

  deferRegisterDocumentActivityLog({
    documentId,
    event: 'tagged',
    userId,
    documentActivityRepository,
    tagId,
  });
}
