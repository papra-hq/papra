import type { Logger } from '@crowlog/logger';
import type { DocumentActivityRepository } from './document-activity.repository';
import type { DocumentActivityEvent } from './document-activity.types';
import { createDeferable } from '../../shared/async/defer';
import { createLogger } from '../../shared/logger/logger';

export async function registerDocumentActivityLog({
  documentId,
  event,
  eventData,
  userId,
  tagId,
  documentActivityRepository,
  logger = createLogger({ namespace: 'document-activity-log' }),
}: {
  documentId: string;
  event: DocumentActivityEvent;
  eventData?: Record<string, unknown>;
  userId?: string;
  tagId?: string;
  documentActivityRepository: DocumentActivityRepository;
  logger?: Logger;
}) {
  await documentActivityRepository.saveDocumentActivity({
    documentId,
    event,
    eventData,
    userId,
    tagId,
  });

  logger.info({
    documentId,
    event,
    eventData,
    userId,
    tagId,
  }, 'Document activity log registered');
}

export const deferRegisterDocumentActivityLog = createDeferable(registerDocumentActivityLog);
