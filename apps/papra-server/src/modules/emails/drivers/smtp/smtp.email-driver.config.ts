import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { booleanishSchema } from '../../../config/config.schemas';
import { coercedNumberSchema } from '../../../shared/schemas/number.schemas';

export const smtpEmailDriverConfig = {
  host: {
    doc: 'The host of the SMTP server',
    schema: v.optional(v.string()),
    default: '',
    env: 'SMTP_HOST',
  },
  port: {
    doc: 'The port of the SMTP server',
    schema: coercedNumberSchema,
    default: 587,
    env: 'SMTP_PORT',
  },
  user: {
    doc: 'The user of the SMTP server',
    schema: v.optional(v.string()),
    default: undefined,
    env: 'SMTP_USER',
  },
  password: {
    doc: 'The password of the SMTP server',
    schema: v.optional(v.string()),
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
    schema: v.optional(v.pipe(
      v.string(),
      v.parseJson(),
    )),
    default: undefined,
    env: 'SMTP_JSON_CONFIG',
  },
} as const satisfies ConfigDefinition;
