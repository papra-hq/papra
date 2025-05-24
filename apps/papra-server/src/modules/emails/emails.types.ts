import type { Config } from '../config/config.types';
import type { Logger } from '../shared/logger/logger';

export type EmailServices = {
  name: string;
  sendEmail: (args: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }) => Promise<void>;
};

export type EmailDriverFactory = (args: { config: Config; logger: Logger }) => EmailServices;
