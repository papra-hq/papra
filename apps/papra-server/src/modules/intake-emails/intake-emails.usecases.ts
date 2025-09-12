import type { CreateDocumentUsecase } from "../documents/documents.usecases";
import type { PlansRepository } from "../plans/plans.repository";
import type { Logger } from "../shared/logger/logger";
import type { SubscriptionsRepository } from "../subscriptions/subscriptions.repository";
import type { IntakeEmailsServices } from "./drivers/intake-emails.drivers.models";
import type { IntakeEmailsRepository } from "./intake-emails.repository";
import { safely } from "@corentinth/chisels";
import { getOrganizationPlan } from "../plans/plans.usecases";
import { addLogContext, createLogger } from "../shared/logger/logger";
import { fileToReadableStream } from "../shared/streams/readable-stream";
import {
  createIntakeEmailLimitReachedError,
  createIntakeEmailNotFoundError,
} from "./intake-emails.errors";
import { getIsFromAllowedOrigin } from "./intake-emails.models";
import { createError } from "../shared/errors/errors";
import { UsersRepository } from "../users/users.repository";
import { isNil } from "../shared/utils";
import { OrganizationsRepository } from "../organizations/organizations.repository";
import { or } from "drizzle-orm";
import { SCHEMA_USERNAME_INTAKE_EMAIL_DRIVER_NAME } from "./drivers/schema-username/schema-username.intake-email-driver";

export async function createIntakeEmail({
  organizationId,
  userId,
  intakeEmailsRepository,
  intakeEmailsServices,
  plansRepository,
  subscriptionsRepository,
  usersRepository,
  organizationsRepository,
}: {
  organizationId: string;
  userId: string;
  intakeEmailsRepository: IntakeEmailsRepository;
  intakeEmailsServices: IntakeEmailsServices;
  plansRepository: PlansRepository;
  subscriptionsRepository: SubscriptionsRepository;
  usersRepository: UsersRepository;
  organizationsRepository: OrganizationsRepository;
}) {
  await checkIfOrganizationCanCreateNewIntakeEmail({
    organizationId,
    plansRepository,
    subscriptionsRepository,
    intakeEmailsRepository,
  });

  let currentUser, currentOrganization;
  //Check if the lookup for the user and organization hints are needed?
  if (intakeEmailsServices.name === SCHEMA_USERNAME_INTAKE_EMAIL_DRIVER_NAME) {
    //userId cannot be null or undefined because of the check "ensureUserIsInOrganization"
    const { user } = await usersRepository.getUserById({ userId });

    if (isNil(user)) {
      //Should not happen, for type-safety
      throw createError({
        statusCode: 404,
        message: "User not found",
        code: "user.not_found",
      });
    }

    currentUser = user;

    const { organization } = await organizationsRepository.getOrganizationById({
      organizationId,
    });

    if (isNil(organization)) {
      throw createError({
        statusCode: 404,
        message: "Organization not found",
        code: "organization.not_found",
      });
    }

    currentOrganization = organization;
  }

  const { emailAddress } = await intakeEmailsServices.generateEmailAddress(
    currentUser,
    currentOrganization
  );

  const { intakeEmail } = await intakeEmailsRepository.createIntakeEmail({
    organizationId,
    emailAddress,
  });

  return { intakeEmail };
}

export async function processIntakeEmailIngestion({
  fromAddress,
  recipientsAddresses,
  attachments,
  intakeEmailsRepository,
  createDocument,
}: {
  fromAddress: string;
  recipientsAddresses: string[];
  attachments: File[];
  intakeEmailsRepository: IntakeEmailsRepository;
  createDocument: CreateDocumentUsecase;
}) {
  return Promise.all(
    recipientsAddresses.map(async (recipientAddress) =>
      safely(
        ingestEmailForRecipient({
          fromAddress,
          recipientAddress,
          attachments,
          intakeEmailsRepository,
          createDocument,
        })
      )
    )
  );
}

export async function ingestEmailForRecipient({
  fromAddress,
  recipientAddress,
  attachments,
  intakeEmailsRepository,
  logger = createLogger({ namespace: "intake-emails.ingest" }),
  createDocument,
}: {
  fromAddress: string;
  recipientAddress: string;
  attachments: File[];
  intakeEmailsRepository: IntakeEmailsRepository;
  logger?: Logger;
  createDocument: CreateDocumentUsecase;
}) {
  const { intakeEmail } =
    await intakeEmailsRepository.getIntakeEmailByEmailAddress({
      emailAddress: recipientAddress,
    });

  if (!intakeEmail) {
    logger.info("Intake email not found");

    return;
  }

  addLogContext({ intakeEmailId: intakeEmail.id });

  if (!intakeEmail.isEnabled) {
    logger.info("Intake email is disabled");

    return;
  }

  const isFromAllowedOrigin = getIsFromAllowedOrigin({
    origin: fromAddress,
    allowedOrigins: intakeEmail.allowedOrigins,
  });

  if (!isFromAllowedOrigin) {
    logger.warn({ fromAddress }, "Origin not allowed");

    return;
  }

  await Promise.all(
    attachments.map(async (file) => {
      const [result, error] = await safely(
        createDocument({
          fileStream: fileToReadableStream(file),
          fileName: file.name,
          mimeType: file.type,
          organizationId: intakeEmail.organizationId,
        })
      );

      if (error) {
        logger.error(
          { error },
          "Failed to create document for intake email ingestion"
        );
      } else {
        logger.info(
          { documentId: result.document.id },
          "Document created for intake email ingestion"
        );
      }
    })
  );
}

export async function checkIfOrganizationCanCreateNewIntakeEmail({
  organizationId,
  plansRepository,
  subscriptionsRepository,
  intakeEmailsRepository,
}: {
  organizationId: string;
  plansRepository: PlansRepository;
  subscriptionsRepository: SubscriptionsRepository;
  intakeEmailsRepository: IntakeEmailsRepository;
}) {
  const { intakeEmailCount } =
    await intakeEmailsRepository.getOrganizationIntakeEmailsCount({
      organizationId,
    });
  const { organizationPlan } = await getOrganizationPlan({
    organizationId,
    plansRepository,
    subscriptionsRepository,
  });

  if (intakeEmailCount >= organizationPlan.limits.maxIntakeEmailsCount) {
    throw createIntakeEmailLimitReachedError();
  }
}

export async function deleteIntakeEmail({
  intakeEmailId,
  organizationId,
  intakeEmailsRepository,
  intakeEmailsServices,
}: {
  intakeEmailId: string;
  organizationId: string;
  intakeEmailsRepository: IntakeEmailsRepository;
  intakeEmailsServices: IntakeEmailsServices;
}) {
  const { intakeEmail } = await intakeEmailsRepository.getIntakeEmail({
    intakeEmailId,
    organizationId,
  });

  if (!intakeEmail) {
    throw createIntakeEmailNotFoundError();
  }

  await intakeEmailsRepository.deleteIntakeEmail({
    organizationId: intakeEmail.organizationId,
    intakeEmailId,
  });
  await intakeEmailsServices.deleteEmailAddress({
    emailAddress: intakeEmail.emailAddress,
  });
}
