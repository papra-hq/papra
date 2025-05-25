import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { booleanishSchema } from '../../../config/config.schemas';
import { parseJson } from '../../../intake-emails/intake-emails.schemas';

export const smtpEmailDriverConfig = {
  host: {
    doc: 'The host of the SMTP server',
    schema: z.string().optional(),
    default: '',
    env: 'SMTP_HOST',
  },
  port: {
    doc: 'The port of the SMTP server',
    schema: z.coerce.number(),
    default: 587,
    env: 'SMTP_PORT',
  },
  user: {
    doc: 'The user of the SMTP server',
    schema: z.string().optional(),
    default: undefined,
    env: 'SMTP_USER',
  },
  password: {
    doc: 'The password of the SMTP server',
    schema: z.string().optional(),
    default: undefined,
    env: 'SMTP_PASSWORD',
  },
  secure: {
    doc: 'Whether to use a secure connection to the SMTP server',
    schema: booleanishSchema,
    default: false,
    env: 'SMTP_SECURE',
  },
  rawConfig: {
    doc: 'The raw configuration for the nodemailer SMTP client in JSON format for advanced use cases. If set, this will override all other config options. See https://nodemailer.com/smtp/ for more details.',
    schema: z.string().transform(parseJson).optional(),
    default: undefined,
    env: 'SMTP_JSON_CONFIG',
  },
} as const satisfies ConfigDefinition;
