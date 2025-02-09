import type { DocumentsRepository } from '../documents/documents.repository';
import type { DocumentStorageService } from '../documents/storage/documents.storage.services';
import type { Logger } from '../shared/logger/logger';
import type { IntakeEmailsRepository } from './intake-emails.repository';
import { safely } from '@corentinth/chisels';
import { createDocument } from '../documents/documents.usecases';
import { addLogContext, createLogger } from '../shared/logger/logger';
import { getEmailUsername, getIsFromAllowedOrigin } from './intake-emails.models';

export function processIntakeEmailIngestion({
  fromAddress,
  recipientsAddresses,
  attachments,
  intakeEmailsRepository,
  documentsRepository,
  documentsStorageService,
}: {
  fromAddress: string;
  recipientsAddresses: string[];
  attachments: File[];
  intakeEmailsRepository: IntakeEmailsRepository;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
}) {
  return Promise.all(
    recipientsAddresses.map(recipientAddress => safely(
      ingestEmailForRecipient({
        fromAddress,
        recipientAddress,
        attachments,
        intakeEmailsRepository,
        documentsRepository,
        documentsStorageService,
      }),
    )),
  );
}

export async function ingestEmailForRecipient({
  fromAddress,
  recipientAddress,
  attachments,
  intakeEmailsRepository,
  documentsRepository,
  documentsStorageService,
  logger = createLogger({ namespace: 'intake-emails.ingest' }),
}: {
  fromAddress: string;
  recipientAddress: string;
  attachments: File[];
  intakeEmailsRepository: IntakeEmailsRepository;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  logger?: Logger;
}) {
  const { username } = getEmailUsername({ email: recipientAddress });

  if (!username) {
    logger.warn('Invalid recipient address, no username found');

    return;
  }

  const { intakeEmail } = await intakeEmailsRepository.getIntakeEmail({ intakeEmailId: username });

  if (!intakeEmail) {
    logger.info('Intake email not found');

    return;
  }

  addLogContext({ intakeEmailId: intakeEmail.id });

  if (!intakeEmail.isEnabled) {
    logger.info('Intake email is disabled');

    return;
  }

  const isFromAllowedOrigin = getIsFromAllowedOrigin({
    origin: fromAddress,
    allowedOrigins: intakeEmail.allowedOrigins,
  });

  if (!isFromAllowedOrigin) {
    logger.warn({ fromAddress }, 'Origin not allowed');

    return;
  }

  await Promise.all(attachments.map(async (file) => {
    const [result, error] = await safely(createDocument({
      file,
      organizationId: intakeEmail.organizationId,
      documentsStorageService,
      documentsRepository,
    }));

    if (error) {
      logger.error({ error }, 'Failed to create document for intake email ingestion');
    } else {
      logger.info({ documentId: result.document.id }, 'Document created for intake email ingestion');
    }
  }));
}
