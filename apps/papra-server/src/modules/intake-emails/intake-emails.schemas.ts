import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { INTAKE_EMAIL_ID_REGEX, RFC_5322_EMAIL_ADDRESS_REGEX } from './intake-emails.constants';

export const intakeEmailIdSchema = createRegexSchema(INTAKE_EMAIL_ID_REGEX);

export const permissiveEmailAddressSchema = createRegexSchema(RFC_5322_EMAIL_ADDRESS_REGEX);

const emailInfoSchema = v.object({
  address: permissiveEmailAddressSchema,
  name: v.optional(v.string()),
});

export const intakeEmailsIngestionMetaSchema = v.object({
  from: emailInfoSchema,
  to: v.array(emailInfoSchema),
  originalTo: v.optional(v.array(emailInfoSchema), []),
});

export const intakeEmailIngestionEmailFieldSchema = v.pipe(
  v.string(),
  v.parseJson(),
  intakeEmailsIngestionMetaSchema,
);

export const allowedOriginsSchema = v.optional(
  v.array(v.pipe(permissiveEmailAddressSchema, v.toLowerCase())),
);
