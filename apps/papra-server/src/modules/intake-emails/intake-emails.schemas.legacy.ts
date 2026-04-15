import { z } from 'zod';
import { INTAKE_EMAIL_ID_REGEX, RFC_5322_EMAIL_ADDRESS_REGEX } from './intake-emails.constants';

export const permissiveEmailAddressSchema = z.string().regex(RFC_5322_EMAIL_ADDRESS_REGEX);

export const emailInfoSchema = z.object({
  address: permissiveEmailAddressSchema,
  name: z.string().optional(),
});

export const intakeEmailsIngestionMetaSchema = z.object({
  from: emailInfoSchema,
  to: z.array(emailInfoSchema),
  originalTo: z.array(emailInfoSchema).optional().default([]),
  // cc: z.array(emailInfoSchema).optional(),
  // subject: z.string(),
  // text: z.string().optional(),
  // html: z.string().optional(),
});

export function parseJson(content: string, ctx: z.RefinementCtx) {
  try {
    return JSON.parse(content);
  } catch (_error) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid json' });
    return z.never;
  }
}

export const intakeEmailIdSchema = z.string().regex(INTAKE_EMAIL_ID_REGEX);

export const allowedOriginsSchema = z.array(permissiveEmailAddressSchema.toLowerCase()).optional();
