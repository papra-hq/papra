import type { DocumentsRepository } from '../documents/documents.repository';
import type { DocumentStorageService } from '../documents/storage/documents.storage.services';
import type { Logger } from '../shared/logger/logger';
import type { IntakeEmailsServices } from './drivers/intake-emails.drivers.models';
import type { IntakeEmailsRepository } from './intake-emails.repository';
import { safely } from '@corentinth/chisels';
import { createDocument } from '../documents/documents.usecases';
import { addLogContext, createLogger } from '../shared/logger/logger';
import { getIsFromAllowedOrigin } from './intake-emails.models';

export async function createIntakeEmail({
  organizationId,
  intakeEmailsRepository,
  intakeEmailsServices,
}: {
  organizationId: string;
  intakeEmailsRepository: IntakeEmailsRepository;
  intakeEmailsServices: IntakeEmailsServices;
}) {
  const { emailAddress } = await intakeEmailsServices.generateEmailAddress();

  const { intakeEmail } = await intakeEmailsRepository.createIntakeEmail({ organizationId, emailAddress });

  return { intakeEmail };
}

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
  const { intakeEmail } = await intakeEmailsRepository.getIntakeEmailByEmailAddress({ emailAddress: recipientAddress });

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
