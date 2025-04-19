import { z } from 'zod';
import { INTAKE_EMAIL_ID_REGEX } from './intake-emails.constants';

export const emailInfoSchema = z.object({
  address: z.string().email(),
  name: z.string().optional(),
});

export const intakeEmailsIngestionMetaSchema = z.object({
  from: emailInfoSchema,
  to: z.array(emailInfoSchema),
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
